import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { GET, POST } from "@/app/api/marketplace/agents/[agentId]/reviews/route"

const userId = "00000000-0000-0000-0000-000000000001"
const agentId = "11111111-1111-1111-1111-111111111111"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))
vi.mock("@/lib/security/request-validator", () => ({
  assertSameOrigin: vi.fn(() => null),
}))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 9, resetTime: 0, retryAfter: 0 })),
  getClientIdentifier: vi.fn(() => "test-client"),
}))

const { createClient } = await import("@/lib/supabase/server")
const { createAdminClient } = await import("@/lib/supabase/admin")
const { getUserIdForApi } = await import("@/lib/auth")

type Result = { data: unknown; error: unknown }

function makeClient(opts: {
  reviews?: Array<Record<string, unknown>>
  userAgent?: Result
  existingReview?: Result
  insertReview?: Result
  profiles?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>
}) {
  const selectArgs: string[] = []
  const from = vi.fn((table: string) => {
    if (table === "agent_reviews") {
      return {
        select: (...args: unknown[]) => {
          selectArgs.push(String(args[0]))
          const chain: any = {}
          // Chainable: supports .eq().eq().single(), .eq().order().range()
          chain.eq = () => ({
            order: () => ({
              range: () => Promise.resolve({ data: opts.reviews ?? [], error: null }),
            }),
            single: () => Promise.resolve(opts.existingReview ?? { data: null, error: { code: "PGRST116" } }),
            eq: chain.eq,
          })
          return chain
        },
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve(opts.insertReview ?? { data: { id: "r1" }, error: null }),
          }),
        }),
      }
    }
    if (table === "user_agents") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve(opts.userAgent ?? { data: null, error: { code: "PGRST116" } }),
            }),
          }),
        }),
      }
    }
    if (table === "profiles") {
      return {
        select: () => ({
          in: () => Promise.resolve({ data: opts.profiles ?? [], error: null }),
        }),
      }
    }
    throw new Error("unexpected table: " + table)
  })
  return { client: { from } as any, from, selectArgs }
}

const getCtx = { params: Promise.resolve({ agentId }) }
const postCtx = { params: Promise.resolve({ agentId }) }

describe("agent reviews (F20)", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ insert: () => Promise.resolve({ data: null, error: null }) }) } as any)
  })

  it("GET never requests or returns author emails", async () => {
    const { client, selectArgs } = makeClient({
      reviews: [{ id: "r1", user_id: userId, rating: 5 }],
      profiles: [{ id: userId, full_name: "Ann", avatar_url: null }],
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const req = new NextRequest(`http://localhost/api/marketplace/agents/${agentId}/reviews`)
    const res = await GET(req, getCtx)
    expect(res.status).toBe(200)

    for (const arg of selectArgs) expect(arg).not.toContain("email")
    const data = await res.json()
    expect(data.reviews[0].author.full_name).toBe("Ann")
    expect(JSON.stringify(data)).not.toContain("email")
  })

  it("POST queues moderation via service role and surfaces its failures", async () => {
    const adminInsert = vi.fn(() => Promise.resolve({ data: null, error: { message: "denied" } }))
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({ insert: adminInsert }),
    } as any)

    const { client } = makeClient({
      userAgent: { data: { agent_id: agentId }, error: null },
      insertReview: { data: { id: "r1" }, error: null },
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const req = new NextRequest(`http://localhost/api/marketplace/agents/${agentId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating: 5, content: "Great" }),
    })
    const res = await POST(req, postCtx)
    // Moderation failure must not be silently ignored.
    expect(res.status).toBe(500)
    expect(adminInsert).toHaveBeenCalled()
  })

  it("POST succeeds when moderation entry is queued", async () => {
    const { client } = makeClient({
      userAgent: { data: { agent_id: agentId }, error: null },
      insertReview: { data: { id: "r1", rating: 4 }, error: null },
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const req = new NextRequest(`http://localhost/api/marketplace/agents/${agentId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating: 4, content: "Good" }),
    })
    const res = await POST(req, postCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
