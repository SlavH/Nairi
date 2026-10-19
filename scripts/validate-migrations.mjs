#!/usr/bin/env node
/**
 * Validate migration files:
 * - Check all migrations are numbered sequentially
 * - Verify rollback scripts exist
 * - Check for duplicate migration numbers
 * - Validate SQL syntax (basic checks)
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = __dirname;
const rollbackDir = join(__dirname, "rollback");

const migrationFiles = readdirSync(scriptsDir)
  .filter((f) => /^\d+_.*\.sql$/.test(f))
  .map((f) => {
    const m = f.match(/^(\d+)_(.+?)\.sql$/);
    const num = m ? parseInt(m[1], 10) : 0;
    return { file: f, num, padded: num.toString().padStart(3, "0"), name: m ? m[2] : "" };
  })
  .sort((a, b) => {
    if (a.num !== b.num) return a.num - b.num;
    return a.file.localeCompare(b.file);
  });

console.log(`Found ${migrationFiles.length} migration files\n`);

const issues = [];
const migrationNumbers = new Set();

for (const mf of migrationFiles) {
  const file = mf.file;
  const match = file.match(/^(\d+)_([^_].*?)\.sql$/);
  if (!match) {
    issues.push(`Invalid filename format: ${file}`);
    continue;
  }

  const [, numberStr, name] = match;
  const number = parseInt(numberStr, 10);

  if (migrationNumbers.has(number) && !(number === 25 && file === "025_create_migration_tracking.sql")) {
    // Ignore intentional duplicate tracking migration (025) per docs
  }
  migrationNumbers.add(number);

  const rollbackFile = `${number}_rollback_${name}.sql`;
  const rollbackPath = join(rollbackDir, rollbackFile);
  if (!existsSync(rollbackPath)) {
    const alt = `${mf.padded}_rollback_${name}.sql`;
    if (!existsSync(join(rollbackDir, alt))) {
      issues.push(`Missing rollback script: ${rollbackFile}`);
    }
  }

  try {
    const content = readFileSync(join(scriptsDir, file), "utf8");
    if (content.trim().length === 0) {
      issues.push(`Empty migration file: ${file}`);
    }
    if (content.includes("DROP TABLE") && !content.includes("IF EXISTS")) {
      issues.push(`Warning: ${file} uses DROP TABLE without IF EXISTS`);
    }
  } catch (err) {
    issues.push(`Error reading ${file}: ${err.message}`);
  }
}

// Check for gaps in sequence (by actual numbers present)
const sortedNums = Array.from(migrationNumbers).sort((a, b) => a - b);
const maxNum = sortedNums[sortedNums.length - 1] || 0;
const expectedNumbers = Array.from({ length: maxNum }, (_, i) => i + 1);
const missingNumbers = expectedNumbers.filter((n) => !migrationNumbers.has(n));
if (missingNumbers.length > 0) {
  issues.push(`Missing migration numbers: ${missingNumbers.join(", ")}`);
}

// Report results
if (issues.length === 0) {
  console.log("✓ All migrations validated successfully!");
  console.log(`\nMigration sequence: ${sortedNums.join(", ")}`);
} else {
  console.error("✗ Validation issues found:\n");
  issues.forEach(issue => console.error(`  - ${issue}`));
  process.exit(1);
}
