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
  .filter((f) => /^\d{3}_.*\.sql$/.test(f))
  .sort();

console.log(`Found ${migrationFiles.length} migration files\n`);

const issues = [];
const migrationNumbers = new Set();

for (const file of migrationFiles) {
  const match = file.match(/^(\d{3})_(.+?)\.sql$/);
  if (!match) {
    issues.push(`Invalid filename format: ${file}`);
    continue;
  }
  
  const [, numberStr, name] = match;
  const number = parseInt(numberStr, 10);
  
  // Check for duplicates
  if (migrationNumbers.has(number)) {
    issues.push(`Duplicate migration number ${number}: ${file}`);
  }
  migrationNumbers.add(number);
  
  // Check for rollback script
  const rollbackFile = `${number}_rollback_${name}.sql`;
  const rollbackPath = join(rollbackDir, rollbackFile);
  if (!existsSync(rollbackPath)) {
    issues.push(`Missing rollback script: ${rollbackFile}`);
  }
  
  // Basic SQL validation
  try {
    const content = readFileSync(join(scriptsDir, file), "utf8");
    if (content.trim().length === 0) {
      issues.push(`Empty migration file: ${file}`);
    }
    
    // Check for common issues
    if (content.includes("DROP TABLE") && !content.includes("IF EXISTS")) {
      issues.push(`Warning: ${file} uses DROP TABLE without IF EXISTS`);
    }
  } catch (err) {
    issues.push(`Error reading ${file}: ${err.message}`);
  }
}

// Check for gaps in sequence
const expectedNumbers = Array.from({ length: migrationFiles.length }, (_, i) => i + 1);
const missingNumbers = expectedNumbers.filter(n => !migrationNumbers.has(n));
if (missingNumbers.length > 0) {
  issues.push(`Missing migration numbers: ${missingNumbers.join(", ")}`);
}

// Report results
if (issues.length === 0) {
  console.log("✓ All migrations validated successfully!");
  console.log(`\nMigration sequence: ${Array.from(migrationNumbers).sort((a, b) => a - b).join(", ")}`);
} else {
  console.error("✗ Validation issues found:\n");
  issues.forEach(issue => console.error(`  - ${issue}`));
  process.exit(1);
}
