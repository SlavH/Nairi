import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { makeSupabaseClient, setMockUser } from "@/__tests__/utils/mock-supabase"

const USER_ID = "00000000-0000-0000-0000-000000000001"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import("@/lib/supabase/server")

import { POST } from "@/app/api/seed/route"

function makeRequest(): Request {
  return new Request("http://localhost/api/seed", { method: "POST" })
}

/**
 * A fully-stubbed supabase client that answers every seed query with an empty
 * table so the seeding flow runs to completion.
 */
function seedClient() {
  const client = makeSupabaseClient({
    feed_posts: { insertResult: () => ({ data: [], error: null }) },
    courses: { insertResult: () => ({ data: [], error: null }) },
    agents: { insertResult: () => ({ data: [], error: null }) },
    knowledge_nodes: { insertResult: () => ({ data: [], error: null }) },
    marketplace_products: { insertResult: () => ({ data: [], error: null }) },
    creator_profiles: {
      // read -> null (create it), then insert -> created profile
      singleQueue: [
        { data: null, error: null },
        { data: { id: "creator-1" }, error: null },
      ],
    },
  })
  return client
}

describe("POST /api/seed - production gating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns 404 in production without ALLOW_SEED", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("ALLOW_SEED", "")
    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Not found" })
  })

  it("returns 404 in production when ALLOW_SEED is not exactly 'true'", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("ALLOW_SEED", "yes")
    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Not found" })
  })

  it("proceeds in production when ALLOW_SEED is 'true'", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("ALLOW_SEED", "true")
    const client = seedClient()
    vi.mocked(createClient).mockResolvedValue(client.client)
    const res = await POST(makeRequest())
    // Unauthenticated -> the next gate (auth) returns 401
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Authentication required" })
  })

  it("proceeds outside production without ALLOW_SEED", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("ALLOW_SEED", "")
    const client = seedClient()
    vi.mocked(createClient).mockResolvedValue(client.client)
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it("runs the full seed flow for an authenticated user in non-production", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const client = seedClient()
    setMockUser(client, { id: USER_ID, email: "seed@example.com", user_metadata: {} })
    vi.mocked(createClient).mockResolvedValue(client.client)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.message).toBe("Database seeding completed")
    expect(body.results.feed_posts.success).toBe(true)
    expect(body.results.courses.success).toBe(true)
    expect(body.results.agents.success).toBe(true)
    expect(body.results.knowledge_nodes.success).toBe(true)
    expect(body.results.marketplace_creations.success).toBe(true)
  })
})
