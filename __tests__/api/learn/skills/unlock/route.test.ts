import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/learn/skills/[skillId]/unlock/route"

const userId = "00000000-0000-0000-0000-000000000001"
const skillId = "11111111-1111-1111-1111-111111111111"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")

type Result = { data: unknown; error: unknown }

function makeClient(opts: {
  skillResult?: Result
  prereqRows?: Array<{ skill_id: string; unlocked: boolean }>
  upsertResult?: Result
}) {
  const from = vi.fn((table: string) => {
    if (table === "skills") {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve(opts.skillResult ?? { data: null, error: null }),
          }),
        }),
      }
    }
    if (table === "user_skills") {
      let upsertCalled = false
      return {
        select: () => ({
          eq: () => ({
            in: () => Promise.resolve({ data: opts.prereqRows ?? [], error: null }),
          }),
        }),
        upsert: () => {
          upsertCalled = true
          return {
            select: () => ({
              single: () =>
                Promise.resolve(
                  opts.upsertResult ?? { data: { id: "us1" }, error: null }
                ),
            }),
          }
        },
        _upsertCalled: () => upsertCalled,
      }
    }
    throw new Error("unexpected table: " + table)
  })
  return { client: { from } as any, from }
}

const context = { params: Promise.resolve({ skillId }) }

describe("POST /api/learn/skills/[skillId]/unlock (F23)", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    const { client } = makeClient({})
    vi.mocked(createClient).mockResolvedValue(client as any)
    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), context)
    expect(res.status).toBe(401)
  })

  it("returns 404 for unknown skill", async () => {
    const { client } = makeClient({ skillResult: { data: null, error: null } })
    vi.mocked(createClient).mockResolvedValue(client as any)
    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), context)
    expect(res.status).toBe(404)
  })

  it("returns 409 with missing prerequisites when prereqs are not unlocked", async () => {
    const { client } = makeClient({
      skillResult: {
        data: { id: skillId, name: "Advanced", prerequisites: ["p1", "p2"] },
        error: null,
      },
      prereqRows: [{ skill_id: "p1", unlocked: true }],
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), context)
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.missing).toEqual(["p2"])
  })

  it("unlocks the skill when prerequisites are satisfied", async () => {
    const userSkill = { id: "us1", unlocked: true }
    const { client } = makeClient({
      skillResult: {
        data: { id: skillId, name: "Basic", prerequisites: [] },
        error: null,
      },
      upsertResult: { data: userSkill, error: null },
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const res = await POST(new NextRequest("http://localhost/x", { method: "POST" }), context)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.userSkill.unlocked).toBe(true)
  })
})
