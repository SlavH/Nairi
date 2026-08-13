import { describe, it, expect, vi, beforeEach } from "vitest"

import { makeSupabaseClient, setMockUser } from "@/__tests__/utils/mock-supabase"

const USER_ID = "00000000-0000-0000-0000-000000000001"
const CREATOR_USER_ID = "00000000-0000-0000-0000-000000000002"

const PRODUCT_ID = "prod-1"
const PRODUCT = {
  id: PRODUCT_ID,
  title: "Test Product",
  price_cents: 1000,
  creator_id: "creator-1",
  purchase_count: 4,
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/stripe", () => ({
  stripe: null,
}))

const { createClient } = await import("@/lib/supabase/server")
const { createClient: supabaseJsCreateClient } = await import("@supabase/supabase-js")

import { POST } from "@/app/api/marketplace/products/[id]/purchase/route"

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/marketplace/products/prod-1/purchase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

interface Harness {
  server: ReturnType<typeof makeSupabaseClient>
  admin: ReturnType<typeof makeSupabaseClient>
}

function setup(
  opts: {
    user?: any
    product?: any
    productError?: any
    existing?: any
    buyerBalanceQueue?: Array<{ data: any; error: any }>
  } = {}
): Harness {
  const server = makeSupabaseClient({
    marketplace_products: {
      singleQueue: [
        { data: opts.product ?? null, error: opts.productError ?? null },
      ],
    },
    product_purchases: {
      singleQueue: [{ data: opts.existing ?? null, error: null }],
    },
    creator_profiles: {
      singleQueue: [{ data: { id: "creator-1", user_id: CREATOR_USER_ID }, error: null }],
    },
  })
  setMockUser(server, opts.user === undefined ? { id: USER_ID, email: "buyer@example.com" } : opts.user)

  const admin = makeSupabaseClient({
    product_purchases: {},
    credit_transactions: {},
    profiles: {
      singleQueue: opts.buyerBalanceQueue ?? [
        { data: { tokens_balance: 200 }, error: null },
      ],
      singleResult: () => ({ data: { tokens_balance: 0 }, error: null }),
      updateResult: () => ({ data: [{ id: "profile" }], error: null }),
    },
    marketplace_products: {
      singleQueue: [{ data: { purchase_count: 4 }, error: null }],
      updateResult: () => ({ data: [{ id: PRODUCT_ID, purchase_count: 5 }], error: null }),
    },
  })

  vi.mocked(createClient).mockResolvedValue(server.client)
  vi.mocked(supabaseJsCreateClient).mockReturnValue(admin.client)

  return { server, admin }
}

describe("POST /api/marketplace/products/[id]/purchase", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    setup({ user: null })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Unauthorized" })
  })

  it("returns 400 when product id is missing", async () => {
    setup()
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: "" }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Product ID required" })
  })

  it("returns 404 when the product is not found", async () => {
    const { server } = setup({ product: null, productError: { message: "not found" } })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: "missing" }),
    })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Product not found" })
    expect(server.from).toHaveBeenCalledWith("marketplace_products")
  })

  it("returns 400 when the user already owns the product", async () => {
    setup({ product: PRODUCT, existing: { id: "purchase-1" } })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "You already own this product" })
  })

  it("free product: records purchase and atomically increments purchase_count", async () => {
    const { admin } = setup({ product: { ...PRODUCT, price_cents: 0 } })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      message: "Product added to your library",
    })

    const purchases = admin.tables.product_purchases.insertValues!
    expect(purchases).toHaveLength(1)
    expect(purchases[0]).toMatchObject({
      user_id: USER_ID,
      product_id: PRODUCT_ID,
      amount_cents: 0,
    })

    const countUpdates = admin.tables.marketplace_products.updateValues!
    expect(countUpdates).toHaveLength(1)
    expect(countUpdates[0]).toMatchObject({ purchase_count: 5 })
  })

  it("free product: purchase_count update failing after insert does not crash the route", async () => {
    const { admin } = setup({ product: { ...PRODUCT, price_cents: 0 } })
    admin.tables.marketplace_products.updateResult = () => ({ data: [], error: null })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      message: "Product added to your library",
    })
    expect(admin.tables.product_purchases.insertValues).toHaveLength(1)
    // 5 CAS attempts were made before giving up
    expect(admin.tables.marketplace_products.updateValues).toHaveLength(5)
  })

  it("credits purchase: debits balance, records transaction, credits creator 70%, increments count", async () => {
    const { admin } = setup({ product: PRODUCT })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      message: "Purchased with credits",
      creditsSpent: 100,
    })

    // Buyer balance 200 -> 100
    const balanceUpdates = admin.tables.profiles.updateValues!
    expect(balanceUpdates).toHaveLength(2)
    expect(balanceUpdates[0]).toMatchObject({ tokens_balance: 100 })

    // Buyer credit_transactions insert with type marketplace_purchase
    const txs = admin.tables.credit_transactions.insertValues!
    expect(txs).toHaveLength(2)
    expect(txs[0]).toMatchObject({
      user_id: USER_ID,
      amount: -100,
      type: "marketplace_purchase",
    })

    // Creator gets floor(100 * 0.7) = 70 (starting from balance 0)
    expect(balanceUpdates[1]).toMatchObject({ tokens_balance: 70 })
    expect(txs[1]).toMatchObject({
      user_id: CREATOR_USER_ID,
      amount: 70,
      type: "marketplace_sale",
    })

    // purchase_count incremented atomically
    expect(admin.tables.marketplace_products.updateValues![0]).toMatchObject({ purchase_count: 5 })
  })

  it("credits purchase: creator share uses floor and skips when no creator profile", async () => {
    const { server, admin } = setup({ product: { ...PRODUCT, price_cents: 990 } })
    server.tables.creator_profiles.singleQueue = [{ data: null, error: null }]
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(200)
    // cost = ceil(990/10) = 99, creator share = floor(99*0.7) = 69
    expect(await res.json()).toEqual({
      success: true,
      message: "Purchased with credits",
      creditsSpent: 99,
    })
    // Only the buyer balance update happened (no creator credit)
    expect(admin.tables.profiles.updateValues).toHaveLength(1)
    expect(admin.tables.credit_transactions.insertValues).toHaveLength(1)
  })

  it("returns 400 with required/available when balance is insufficient and performs no insert", async () => {
    const { admin } = setup({
      product: PRODUCT,
      buyerBalanceQueue: [{ data: { tokens_balance: 50 }, error: null }],
    })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: "Insufficient credits",
      required: 100,
      available: 50,
    })
    expect(admin.tables.product_purchases.insertValues).toHaveLength(0)
    expect(admin.tables.credit_transactions.insertValues).toHaveLength(0)
  })

  it("CAS retry: stale update (0 rows) once then success still succeeds and exercises the retry loop", async () => {
    const { admin } = setup({ product: { ...PRODUCT, creator_id: null } })
    admin.tables.profiles.singleResult = () => ({ data: { tokens_balance: 200 }, error: null })
    let profileUpdates = 0
    admin.tables.profiles.updateResult = () => {
      profileUpdates += 1
      return profileUpdates === 1
        ? { data: [], error: null }
        : { data: [{ id: "profile", tokens_balance: 100 }], error: null }
    }
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ success: true, creditsSpent: 100 })

    // Deduction took 2 attempts (2x select + 2x update on profiles)
    const profileFromCalls = admin.from.mock.calls.filter((c: string[]) => c[0] === "profiles")
    expect(profileFromCalls).toHaveLength(4)
    expect(profileUpdates).toBeGreaterThanOrEqual(2)
  })

  it("CAS always returning 0 rows fails the purchase without recording it", async () => {
    const { admin } = setup({ product: PRODUCT })
    admin.tables.profiles.singleResult = () => ({ data: { tokens_balance: 200 }, error: null })
    admin.tables.profiles.updateResult = () => ({ data: [], error: null })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    // The code surfaces the CAS failure as a 500 (not a 4xx conflict)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain("Could not update balance atomically")
    expect(admin.tables.product_purchases.insertValues).toHaveLength(0)
    expect(admin.tables.credit_transactions.insertValues).toHaveLength(0)
    // All 5 attempts were exhausted
    expect(admin.tables.profiles.updateValues).toHaveLength(5)
  })

  it("refunds the balance atomically when the purchase insert fails after debiting", async () => {
    const { admin } = setup({
      product: PRODUCT,
      buyerBalanceQueue: [
        { data: { tokens_balance: 200 }, error: null },
        { data: { tokens_balance: 100 }, error: null },
      ],
    })
    admin.tables.product_purchases.insertResult = () => ({
      data: null,
      error: { message: "RLS violation" },
    })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Failed to record purchase" })

    // Debit (-100) then refund (+100) — exactly 2 balance updates, no double refund
    const balanceUpdates = admin.tables.profiles.updateValues!
    expect(balanceUpdates).toHaveLength(2)
    expect(balanceUpdates[0]).toMatchObject({ tokens_balance: 100 })
    expect(balanceUpdates[1]).toMatchObject({ tokens_balance: 200 })
    expect(admin.tables.credit_transactions.insertValues).toHaveLength(0)
  })

  it("refunds the balance atomically when the credit_transactions insert fails after purchase insert", async () => {
    const { admin } = setup({
      product: PRODUCT,
      buyerBalanceQueue: [
        { data: { tokens_balance: 200 }, error: null },
        { data: { tokens_balance: 100 }, error: null },
      ],
    })
    admin.tables.credit_transactions.insertResult = () => ({
      data: null,
      error: { message: "constraint violated" },
    })
    const res = await POST(makeRequest({ useCredits: true }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Failed to record purchase" })

    const balanceUpdates = admin.tables.profiles.updateValues!
    expect(balanceUpdates).toHaveLength(2)
    expect(balanceUpdates[0]).toMatchObject({ tokens_balance: 100 })
    expect(balanceUpdates[1]).toMatchObject({ tokens_balance: 200 })
    // The sale transaction for the creator must never happen
    expect(admin.tables.credit_transactions.insertValues).toHaveLength(1)
  })

  it("non-credit purchase with stripe unconfigured returns 500", async () => {
    const { admin } = setup({ product: PRODUCT })
    const res = await POST(makeRequest({ useCredits: false }), {
      params: Promise.resolve({ id: PRODUCT_ID }),
    })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Payment processing not configured" })
    expect(admin.tables.product_purchases.insertValues).toHaveLength(0)
  })
})
