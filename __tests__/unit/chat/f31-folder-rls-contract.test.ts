/**
 * F31: conversation_folders RLS contract (migration policy audit).
 *
 * scripts/023 must enable RLS and create owner-scoped policies for all four
 * commands, and no SQL migration may add a permissive policy on
 * conversation_folders. String/content assertions — no DB in CI.
 */
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const MIGRATION_023 = path.join(ROOT, "scripts/023_create_conversation_folders_and_tags.sql")

interface FolderPolicy {
  file: string
  name: string
  command: string
  clause: string
}

const POLICY_RE =
  /CREATE\s+POLICY\s+(?:"([^"]+)"|(\S+))\s+ON\s+(?:public\.)?conversation_folders\s+FOR\s+(SELECT|INSERT|UPDATE|DELETE)\s+([^;]*);/gi

function folderPoliciesIn(file: string): FolderPolicy[] {
  const sql = readFileSync(file, "utf8")
  const out: FolderPolicy[] = []
  POLICY_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = POLICY_RE.exec(sql)) !== null) {
    out.push({
      file: path.relative(ROOT, file),
      name: match[1] ?? match[2],
      command: match[3].toUpperCase(),
      clause: match[4],
    })
  }
  return out
}

function allMigrationSqlFiles(): string[] {
  return [path.join(ROOT, "scripts"), path.join(ROOT, "supabase/migrations")].flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => path.join(dir, f))
  )
}

describe("F31 conversation_folders RLS contract", () => {
  it("023 enables row level security on conversation_folders", () => {
    const sql = readFileSync(MIGRATION_023, "utf8")
    expect(sql).toMatch(
      /ALTER\s+TABLE\s+(?:public\.)?conversation_folders\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i
    )
  })

  it("023 creates an owner-scoped policy for select, insert, update and delete", () => {
    const policies = folderPoliciesIn(MIGRATION_023)
    for (const command of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      const policy = policies.find((p) => p.command === command)
      expect(policy, `023 should CREATE a ${command} policy on conversation_folders`).toBeDefined()
      expect(policy!.clause).toMatch(/auth\.uid\(\)\s*=\s*user_id/)
    }
  })

  it("no migration creates a non-owner-scoped policy on conversation_folders", () => {
    const policies = allMigrationSqlFiles().flatMap(folderPoliciesIn)
    expect(policies.length).toBeGreaterThan(0)
    for (const policy of policies) {
      expect(
        policy.clause,
        `${policy.file}: policy "${policy.name}" on conversation_folders must be scoped to auth.uid() = user_id`
      ).toMatch(/auth\.uid\(\)\s*=\s*user_id/)
      expect(policy.clause, `${policy.file}: policy "${policy.name}" must not be USING (true)`).not.toMatch(
        /USING\s*\(\s*true\s*\)/i
      )
    }
  })
})
