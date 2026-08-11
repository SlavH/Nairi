/**
 * RLS policy-name contract test (F5).
 *
 * Guards against the hardening migration dropping policies by names that were
 * never created: 006_create_subscriptions.sql creates subscriptions_insert_own /
 * subscriptions_update_own, and 010_create_marketplace_extended.sql creates
 * purchases_own. If the hardening migration's DROP POLICY names drift from the
 * real ones, DROP POLICY IF EXISTS silently no-ops and the self-grant /
 * purchase-forgery vulns stay open. This test parses the SQL files and checks.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const HARDENING_SQL = path.join(ROOT, "supabase/migrations/20260804_harden_rls_policies.sql");
const SUBSCRIPTIONS_SQL = path.join(ROOT, "scripts/006_create_subscriptions.sql");
const MARKETPLACE_SQL = path.join(ROOT, "scripts/010_create_marketplace_extended.sql");

interface PolicyRef {
  name: string;
  table: string;
}

function parsePolicies(sql: string, kind: "CREATE" | "DROP"): PolicyRef[] {
  const pattern =
    kind === "CREATE"
      ? /CREATE\s+POLICY\s+(?:"([^"]+)"|([^\s]+))\s+ON\s+(?:(?:public|auth)\.)?([a-zA-Z0-9_]+)/gi
      : /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:"([^"]+)"|([^\s]+))\s+ON\s+(?:(?:public|auth)\.)?([a-zA-Z0-9_]+)/gi;

  const refs: PolicyRef[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sql)) !== null) {
    refs.push({ name: match[1] ?? match[2], table: match[3] });
  }
  return refs;
}

function groupByTable(refs: PolicyRef[]): Map<string, Set<string>> {
  const byTable = new Map<string, Set<string>>();
  for (const ref of refs) {
    const names = byTable.get(ref.table) ?? new Set<string>();
    names.add(ref.name);
    byTable.set(ref.table, names);
  }
  return byTable;
}

function read(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

describe("RLS hardening migration policy-name contract (F5)", () => {
  it("006 creates the subscriptions policies the hardening migration must drop", () => {
    const created = groupByTable(parsePolicies(read(SUBSCRIPTIONS_SQL), "CREATE"));
    const onSubscriptions = created.get("subscriptions") ?? new Set<string>();
    for (const name of ["subscriptions_insert_own", "subscriptions_update_own"]) {
      expect(onSubscriptions, `006 should CREATE POLICY "${name}" on subscriptions`).toContain(name);
    }
  });

  it("010 creates the product_purchases policy the hardening migration must drop", () => {
    const created = groupByTable(parsePolicies(read(MARKETPLACE_SQL), "CREATE"));
    const onPurchases = created.get("product_purchases") ?? new Set<string>();
    expect(onPurchases, '010 should CREATE POLICY "purchases_own" on product_purchases').toContain(
      "purchases_own"
    );
  });

  it("hardening migration drops only names actually created in 006/010", () => {
    const drops = groupByTable(parsePolicies(read(HARDENING_SQL), "DROP"));
    const createdSubscriptions = groupByTable(parsePolicies(read(SUBSCRIPTIONS_SQL), "CREATE"));
    const createdPurchases = groupByTable(parsePolicies(read(MARKETPLACE_SQL), "CREATE"));

    const subscriptionsDrops = drops.get("subscriptions") ?? new Set<string>();
    const purchasesDrops = drops.get("product_purchases") ?? new Set<string>();

    for (const name of subscriptionsDrops) {
      expect(createdSubscriptions.get("subscriptions") ?? new Set<string>(), `DROP POLICY ${name} on subscriptions must exist in 006`).toContain(name);
    }
    for (const name of purchasesDrops) {
      expect(createdPurchases.get("product_purchases") ?? new Set<string>(), `DROP POLICY ${name} on product_purchases must exist in 010`).toContain(name);
    }

    // The vulnerable policies must actually be the ones dropped.
    expect(subscriptionsDrops).toContain("subscriptions_insert_own");
    expect(subscriptionsDrops).toContain("subscriptions_update_own");
    expect(purchasesDrops).toContain("purchases_own");
  });

  it("no longer references the mismatched policy names", () => {
    const hardening = read(HARDENING_SQL);
    expect(hardening).not.toContain('"Users can manage own subscriptions"');
    expect(hardening).not.toContain('"Users can create own purchases"');
  });

  it("replaces the dropped write policies with service-role-only guards", () => {
    const hardening = read(HARDENING_SQL);
    expect(hardening).toMatch(/CREATE\s+POLICY\s+"Service role can insert subscriptions"\s+ON\s+subscriptions\s+FOR\s+INSERT\s+WITH\s+CHECK\s*\(\s*false\s*\)/i);
    expect(hardening).toMatch(/CREATE\s+POLICY\s+"Service role can update subscriptions"\s+ON\s+subscriptions\s+FOR\s+UPDATE/i);
    expect(hardening).toMatch(/CREATE\s+POLICY\s+"Service role can insert purchases"\s+ON\s+product_purchases\s+FOR\s+INSERT\s+WITH\s+CHECK\s*\(\s*false\s*\)/i);
  });
});
