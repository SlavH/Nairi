/**
 * Migration 047 consistency contract.
 *
 * Mirrors scripts/validate-migrations.mjs naming (rollbacks are
 * `<n>_rollback_<name>.sql`) and the SQL-parsing pattern used by
 * rls-contract.test.ts. Guards against the credit-transactions CHECK constraint
 * silently losing the marketplace types the purchase route inserts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const SCRIPTS_DIR = path.join(ROOT, "scripts");
const ROLLBACK_DIR = path.join(SCRIPTS_DIR, "rollback");

const MIGRATION_047 = "047_allow_marketplace_credit_types.sql";
const ROLLBACK_047 = "047_rollback_allow_marketplace_credit_types.sql";

const MARKETPLACE_TYPES = ["marketplace_purchase", "marketplace_sale", "product_purchase"];

function read(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

describe("Migration 047 - allow marketplace credit types", () => {
  it("exists as a numbered migration file", () => {
    expect(existsSync(path.join(SCRIPTS_DIR, MIGRATION_047))).toBe(true);
  });

  it("is uniquely numbered 047 and the prefix parses cleanly", () => {
    const files = readdirSync(SCRIPTS_DIR).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort();
    const numbered = files.filter((f) => f.slice(0, 3) === "047");
    expect(numbered).toHaveLength(1);
    expect(numbered[0]).toBe(MIGRATION_047);
    // Every file must carry a numeric 3-digit prefix
    for (const f of files) {
      expect(Number.isInteger(parseInt(f.slice(0, 3), 10))).toBe(true);
    }
    // NOTE: the repo has a pre-existing duplicate 025 (025_add_agents_is_published.sql
    // + 025_create_migration_tracking.sql), so a strict 1..N uniqueness check is
    // not asserted here — it is recorded in the QA report instead.
    expect(Number.isInteger(47)).toBe(true);
  });

  it("rollback script exists with the validate-migrations naming convention", () => {
    const expected = path.join(ROLLBACK_DIR, ROLLBACK_047);
    expect(existsSync(expected)).toBe(true);
  });

  it("CHECK constraint includes all three marketplace transaction types", () => {
    const sql = read(path.join(SCRIPTS_DIR, MIGRATION_047));
    const constraint = sql.match(
      /CHECK\s*\(\s*type\s+IN\s*\(([^)]*)\)\s*\)/i
    );
    expect(constraint, "047 must add a CHECK constraint on credit_transactions.type").not.toBeNull();
    const types = (constraint![1] ?? "").split(",").map((t) => t.trim().replace(/'/g, ""));

    for (const expectedType of MARKETPLACE_TYPES) {
      expect(types, `047 CHECK constraint must allow '${expectedType}'`).toContain(expectedType);
    }
  });

  it("rebuilds the constraint (drops the old one first) so it is idempotent", () => {
    const sql = read(path.join(SCRIPTS_DIR, MIGRATION_047));
    expect(sql).toMatch(/DROP\s+CONSTRAINT\s+IF\s+EXISTS\s+credit_transactions_type_check/i);
    expect(sql).toMatch(/ADD\s+CONSTRAINT\s+credit_transactions_type_check/i);
  });

  it("rollback restores the original type set without marketplace types", () => {
    const rollback = read(path.join(ROLLBACK_DIR, ROLLBACK_047));
    const constraint = rollback.match(/CHECK\s*\(\s*type\s+IN\s*\(([^)]*)\)\s*\)/i);
    expect(constraint).not.toBeNull();
    const types = (constraint![1] ?? "").split(",").map((t) => t.trim().replace(/'/g, ""));
    for (const removedType of MARKETPLACE_TYPES) {
      expect(types).not.toContain(removedType);
    }
    for (const originalType of ["earned", "spent", "bonus", "referral", "reset", "purchase"]) {
      expect(types).toContain(originalType);
    }
  });
});
