#!/usr/bin/env node
/**
 * Run all SQL migration files in scripts/ in numeric order.
 * Requires DATABASE_URL in .env or environment (Supabase → Project Settings → Database → Connection string).
 * 
 * Features:
 * - Tracks migration status in database
 * - Skips already-applied migrations
 * - Records execution time and checksums
 * - Supports rollback tracking
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
// Load .env from project root and from cwd (npm run migrate runs from project root)
dotenv.config({ path: join(projectRoot, ".env") });
dotenv.config({ path: join(process.cwd(), ".env") });

const raw =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DIRECT_URL;
const DATABASE_URL = raw ? String(raw).trim() : "";

if (!DATABASE_URL) {
  const dbLikeKeys = Object.keys(process.env).filter((k) =>
    /database|postgres|direct|connection|sql|uri|_url|db_/i.test(k)
  );
  console.error(
    "Missing DATABASE_URL (or POSTGRES_URL / SUPABASE_DATABASE_URL / DIRECT_URL). Set it in .env. Get it from Supabase → Project Settings → Database (Connection string)."
  );
  if (dbLikeKeys.length) {
    console.error("Env keys that might be your DB URL:", dbLikeKeys.join(", "));
  }
  process.exit(1);
}

// Validate DATABASE_URL format
try {
  const url = new URL(DATABASE_URL);
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    console.error(`Error: DATABASE_URL must use postgresql:// or postgres:// protocol, got: ${url.protocol}`);
    process.exit(1);
  }
  
  // Check for placeholder values
  if (DATABASE_URL.includes("[YOUR-PASSWORD]") || DATABASE_URL.includes("YOUR-PASSWORD")) {
    console.error("Error: DATABASE_URL contains placeholder [YOUR-PASSWORD] - replace with actual password");
    process.exit(1);
  }
  
  // Warn about brackets (common mistake)
  if (DATABASE_URL.includes("[") && DATABASE_URL.includes("]")) {
    console.warn("Warning: DATABASE_URL contains brackets [] - make sure password is properly URL-encoded");
  }
  
  // Warn about Direct connection
  const port = url.port ? parseInt(url.port, 10) : 5432;
  if (port === 5432) {
    console.warn("Warning: Using Direct connection (port 5432) - consider using Transaction pooler (port 6543) for better reliability");
  }
  
} catch (err) {
  console.error(`Error: DATABASE_URL is not a valid URL: ${err.message}`);
  console.error(`Value: ${DATABASE_URL.substring(0, 50)}...`);
  process.exit(1);
}

const scriptsDir = join(__dirname);
const files = readdirSync(scriptsDir)
  .filter((f) => /^\d{3}_.*\.sql$/.test(f))
  .sort();

if (files.length === 0) {
  console.error("No migration files (NNN_*.sql) found in scripts/");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

function calculateChecksum(content) {
  return createHash("sha256").update(content).digest("hex");
}

function extractMigrationNumber(filename) {
  const match = filename.match(/^(\d{3})_/);
  return match ? parseInt(match[1], 10) : null;
}

async function checkMigrationStatus(client, migrationName) {
  try {
    const result = await client.query(
      `SELECT status FROM public.migration_status WHERE migration_name = $1`,
      [migrationName]
    );
    return result.rows[0]?.status === "applied";
  } catch (err) {
    // Table doesn't exist yet - this is fine for first migration
    if (err.code === "42P01") return false;
    throw err;
  }
}

async function recordMigration(client, migrationName, migrationNumber, checksum, rollbackScript, executionTimeMs) {
  try {
    await client.query(
      `SELECT public.record_migration($1, $2, $3, $4, $5)`,
      [migrationName, migrationNumber, checksum, rollbackScript, executionTimeMs]
    );
  } catch (err) {
    // Function doesn't exist yet - skip tracking for migration 025 itself
    if (err.code === "42883") {
      console.warn(`  (Migration tracking not available yet)`);
    } else {
      throw err;
    }
  }
}

async function run() {
  let currentFile = null;
  try {
    await client.connect();
    
    // Check if migration tracking table exists
    const trackingExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_status'
      )
    `).then(r => r.rows[0].exists);
    
    if (!trackingExists) {
      console.log("Migration tracking table not found. Migrations will run without tracking.");
    }
    
    for (const file of files) {
      currentFile = file;
      const path = join(scriptsDir, file);
      const sql = readFileSync(path, "utf8");
      const migrationName = file.replace(/\.sql$/, "");
      const migrationNumber = extractMigrationNumber(file);
      const checksum = calculateChecksum(sql);
      
      // Check if already applied (skip migration tracking table creation check)
      if (trackingExists && file !== "025_create_migration_tracking.sql") {
        const isApplied = await checkMigrationStatus(client, migrationName);
        if (isApplied) {
          console.log(`Skipping ${file} (already applied)`);
          continue;
        }
      }
      
      // Check for rollback script
      const rollbackPath = join(__dirname, "rollback", file.replace(/^(\d{3})_/, "$1_rollback_"));
      const rollbackScript = existsSync(rollbackPath) ? rollbackPath : null;
      
      process.stdout.write(`Running ${file} ... `);
      const startTime = Date.now();
      
      try {
        await client.query(sql);
        const executionTimeMs = Date.now() - startTime;
        
        // Record migration (skip if tracking table doesn't exist yet)
        if (trackingExists || file === "025_create_migration_tracking.sql") {
          await recordMigration(
            client,
            migrationName,
            migrationNumber || 0,
            checksum,
            rollbackScript,
            executionTimeMs
          );
        }
        
        console.log(`OK (${executionTimeMs}ms)`);
      } catch (err) {
        const executionTimeMs = Date.now() - startTime;
        throw err;
      }
    }
    console.log("\nAll migrations completed.");
    
    // Show migration status summary
    if (trackingExists) {
      try {
        const summary = await client.query(`SELECT * FROM public.migration_status_overview ORDER BY migration_number`);
        if (summary.rows.length > 0) {
          console.log("\nMigration Status Summary:");
          console.log("─".repeat(60));
          summary.rows.forEach(row => {
            console.log(`${row.status_icon} ${String(row.migration_number).padStart(3, "0")} - ${row.migration_name.padEnd(40)} ${row.execution_time_ms ? `(${row.execution_time_ms}ms)` : ""}`);
          });
        }
      } catch (err) {
        // Ignore errors in summary
      }
    }
  } catch (err) {
    console.error("\nMigration failed" + (currentFile ? ` in ${currentFile}` : " (connect or before first file)") + ":");
    console.error(err.message || "(no message)");
    if (err.detail) console.error("Detail:", err.detail);
    if (err.where) console.error("Where:", err.where);
    if (err.position) console.error("Position:", err.position);
    if (err.code) console.error("Code:", err.code);
    if (err.message !== String(err)) console.error(String(err));
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

run();
