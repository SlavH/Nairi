#!/usr/bin/env node
/**
 * Script to make all migrations idempotent by adding DROP IF EXISTS before CREATE statements
 * This is a helper script - run manually to check what needs to be fixed
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = __dirname;

const files = readdirSync(scriptsDir)
  .filter((f) => /^\d{3}_.*\.sql$/.test(f))
  .sort();

console.log(`Found ${files.length} migration files to check`);

for (const file of files) {
  const path = join(scriptsDir, file);
  let content = readFileSync(path, "utf8");
  let modified = false;

  // Fix CREATE POLICY statements
  const policyRegex = /CREATE POLICY\s+"([^"]+)"\s+ON\s+public\.(\w+)\s+FOR\s+(\w+)/g;
  const policies = [];
  let match;
  
  while ((match = policyRegex.exec(content)) !== null) {
    const policyName = match[1];
    const tableName = match[2];
    const operation = match[3];
    policies.push({ policyName, tableName, operation, fullMatch: match[0] });
  }

  // Add DROP POLICY IF EXISTS before each CREATE POLICY
  for (const policy of policies.reverse()) {
    const createPattern = new RegExp(
      `CREATE POLICY\\s+"${policy.policyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s+ON\\s+public\\.${policy.tableName}\\s+FOR\\s+${policy.operation}[^;]*;`,
      "g"
    );
    
    if (createPattern.test(content)) {
      const dropStatement = `DROP POLICY IF EXISTS "${policy.policyName}" ON public.${policy.tableName};\n`;
      content = content.replace(
        createPattern,
        (match) => {
          // Check if DROP already exists before this CREATE
          const beforeMatch = content.substring(0, content.indexOf(match));
          if (!beforeMatch.includes(`DROP POLICY IF EXISTS "${policy.policyName}"`)) {
            modified = true;
            return dropStatement + match;
          }
          return match;
        }
      );
    }
  }

  // Fix CREATE FUNCTION statements (add DROP FUNCTION IF EXISTS)
  const functionRegex = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+(\w+\.)?(\w+)\s*\(/g;
  const functions = [];
  
  while ((match = functionRegex.exec(content)) !== null) {
    const schema = match[2] || "public.";
    const funcName = match[3];
    functions.push({ funcName, schema, fullMatch: match[0] });
  }

  for (const func of functions.reverse()) {
    const createPattern = new RegExp(
      `CREATE\\s+(OR\\s+REPLACE\\s+)?FUNCTION\\s+${func.schema.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${func.funcName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`,
      "g"
    );
    
    if (createPattern.test(content)) {
      const dropStatement = `DROP FUNCTION IF EXISTS ${func.schema}${func.funcName} CASCADE;\n`;
      content = content.replace(
        createPattern,
        (match) => {
          const beforeMatch = content.substring(0, content.indexOf(match));
          if (!beforeMatch.includes(`DROP FUNCTION IF EXISTS ${func.schema}${func.funcName}`)) {
            modified = true;
            return dropStatement + match;
          }
          return match;
        }
      );
    }
  }

  // Fix CREATE INDEX statements
  const indexRegex = /CREATE\s+(UNIQUE\s+)?INDEX\s+(IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+public\.(\w+)/g;
  const indexes = [];
  
  while ((match = indexRegex.exec(content)) !== null) {
    const indexName = match[3];
    const tableName = match[4];
    indexes.push({ indexName, tableName });
  }

  for (const idx of indexes.reverse()) {
    const createPattern = new RegExp(
      `CREATE\\s+(UNIQUE\\s+)?INDEX\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${idx.indexName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+ON\\s+public\\.${idx.tableName}[^;]*;`,
      "g"
    );
    
    if (createPattern.test(content) && !content.includes(`CREATE INDEX IF NOT EXISTS ${idx.indexName}`)) {
      const dropStatement = `DROP INDEX IF EXISTS ${idx.indexName};\n`;
      content = content.replace(
        createPattern,
        (match) => {
          const beforeMatch = content.substring(0, content.indexOf(match));
          if (!beforeMatch.includes(`DROP INDEX IF EXISTS ${idx.indexName}`)) {
            modified = true;
            return dropStatement + match;
          }
          return match;
        }
      );
    }
  }

  if (modified) {
    console.log(`Modified: ${file}`);
    // Uncomment to actually write files:
    // writeFileSync(path, content, "utf8");
  } else {
    console.log(`No changes needed: ${file}`);
  }
}

console.log("\nDone! Review changes above. Uncomment writeFileSync to apply changes.");
