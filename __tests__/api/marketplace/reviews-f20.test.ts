import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/marketplace/reviews/route"
import { PATCH } from "@/app/api/marketplace/reviews/route"

const userId = "00000000-0000-0000-0000-000000000001"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

const { createClient } = await import("@/lib/supabase/server")

function makeClient(opts: {
  purchase?: Result
  existingReview?: Result
  insertOk?: boolean
  reviewsForStats?: Array<{ rating: number }>
  rpcError?: unknown
}) {
  type Result = { data: unknown; error: unknown }
  const from = vi.fn((table: string) => {
    if (table === "product_purchases") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve(opts.purchase ?? { data: null, error: { code: "PGRST116" } }),
            }),
          }),
        }),
      }
    }
    if (table === "product_reviews") {
      return {
        select: () => ({
          eq: (col: string) =>
            col === "rating"
              ? Promise.resolve({ data: opts.reviewsForStats ?? [{ rating: 5 }], error: null })
              : {
                  eq: () => ({
                    single: () => Promise.resolve(opts.existingReview ?? { data: null, error: { code: "PGRST116" } }),
                  }),
                },
        }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }
    }
    if (table === "marketplace_products") {
      return { update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }
    }
    throw new Error("unexpected table: " + table)
  })
  return {
    client: {
      from,
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: userId } } })) },
      rpc: vi.fn(() => Promise.resolve({ data: null, error: opts.rpcError ?? null })),
    } as any,
  }
}

function post(body: unknown) {
  return new Request("http://localhost/api/marketplace/reviews", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("product reviews (F20)", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset()
  })

  it("rejects reviews from users who did not purchase the product", async () => {
    vi.mocked(createClient).mockResolvedValue(makeClient({ purchase: { data: null, error: {} } }).client)
    const res = await POST(post({ productId: "p1", rating: 5, reviewText: "nice" }))
    expect(res.status).toBe(403)
    expect(JSON.stringify(await res.json())).toContain("verified purchasers")
  })

  it("accepts a review from a verified purchaser", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ purchase: { data: { id: "buy1" }, error: null }, insertOk: true }).client
    )
    const res = await POST(post({ productId: "p1", rating: 5, reviewText: "great product" }))
    expect(res.status).toBe(200)
    expect(JSON.stringify(await res.json())).toContain("success")
  })

  it("PATCH no longer inflates helpful_count via direct fallback update", async () => {
    const { client } = makeClient({})
    vi.mocked(createClient).mockResolvedValue(client.client)

    // RPC error simulates missing increment_helpful_count.
    const rpcFailing = makeClient({ rpcError: { message: "function not found" } }).client
    vi.mocked(createClient).mockResolvedValue(rpcFailing)
    const res = await PATCH(
      new Request("http://localhost/api/marketplace/reviews", {
        method: "PATCH",
        body: JSON.stringify({ reviewId: "r1" }),
      })
    )
    expect(res.status).toBe(501)
  })
})
