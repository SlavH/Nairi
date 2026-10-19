import { describe, it, expect, vi, beforeEach } from "vitest"

import { makeSupabaseClient, setMockUser } from "@/__tests__/utils/mock-supabase"

const USER_ID = "00000000-0000-0000-0000-000000000001"
const AGENT_ID = "agent-1"

const FREE_AGENT = {
  id: AGENT_ID,
  name: "Free Agent",
  description: "free",
  price_cents: 0,
  is_free: true,
  creator_id: null,
  image_url: null,
}

const PAID_AGENT = {
  id: AGENT_ID,
  name: "Paid Agent",
  description: "paid",
  price_cents: 1000,
  is_free: false,
  creator_id: "creator-1",
  image_url: null,
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/stripe", () => ({
  stripe: null,
}))

const { createClient } = await import("@/lib/supabase/server")

import { POST as purchasePost } from "@/app/api/marketplace/purchase/route"
import { POST as installPost } from "@/app/api/marketplace/agents/[agentId]/install/route"

const rpcMock = vi.fn()

function setup(opts: { agent?: any; agentError?: any; user?: any } = {}) {
  // Only the `agents` read is configured. The old code's check-then-insert
  // touched user_agents/profiles, which makeSupabaseClient rejects with
  // "Unexpected table" — so any non-atomic write path fails these tests.
  const server = makeSupabaseClient({
    agents: {
      singleResult: () => ({ data: opts.agent ?? null, error: opts.agentError ?? null }),
    },
  })
  setMockUser(
    server,
    opts.user === undefined ? { id: USER_ID, email: "buyer@example.com" } : opts.user
  )
  server.client.rpc = rpcMock
  vi.mocked(createClient).mockResolvedValue(server.client)
  return server
}

function purchaseRequest(body: unknown): Request {
  return new Request("http://localhost/api/marketplace/purchase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function installRequest(body: unknown): Request {
  return new Request(`http://localhost/api/marketplace/agents/${AGENT_ID}/install`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const ROUTES = [
  {
    name: "POST /api/marketplace/purchase",
    call: (body: unknown) => purchasePost(purchaseRequest({ agentId: AGENT_ID, ...((body as object) ?? {}) })),
  },
  {
    name: "POST /api/marketplace/agents/[agentId]/install",
    call: (body: unknown) =>
      installPost(installRequest(body), { params: Promise.resolve({ agentId: AGENT_ID }) }),
  },
]

describe.each(ROUTES)("$name (F36 atomic purchase)", ({ call }) => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it("returns 401 when unauthenticated and never calls the RPC", async () => {
    setup({ agent: FREE_AGENT, user: null })
    const res = await call({})
    expect(res.status).toBe(401)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("returns 404 when the agent does not exist and never calls the RPC", async () => {
    setup({ agent: null, agentError: { message: "not found" } })
    const res = await call({})
    expect(res.status).toBe(404)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("free agent: grants via a single atomic RPC without any user_agents/profiles access", async () => {
    const server = setup({ agent: FREE_AGENT })
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        already_owned: false,
        credits_spent: 0,
        new_balance: 1000,
        agent: FREE_AGENT,
      },
      error: null,
    })

    const res = await call({})
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({ success: true, creditsSpent: 0 })

    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith("purchase_agent_atomic", {
      p_user_id: USER_ID,
      p_agent_id: AGENT_ID,
      p_use_credits: false,
    })

    // No non-atomic check-then-insert: the only table touched is the agents read
    const tables = server.from.mock.calls.map((c: string[]) => c[0])
    expect(tables).toEqual(["agents"])
    expect(server.tables.agents.updateValues).toHaveLength(0)
  })

  it("credits purchase: delegates to the RPC once and returns creditsSpent/newBalance", async () => {
    const server = setup({ agent: PAID_AGENT })
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        already_owned: false,
        credits_spent: 100,
        new_balance: 900,
        agent: PAID_AGENT,
      },
      error: null,
    })

    const res = await call({ useCredits: true })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({ success: true, creditsSpent: 100, newBalance: 900 })

    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith("purchase_agent_atomic", {
      p_user_id: USER_ID,
      p_agent_id: AGENT_ID,
      p_use_credits: true,
    })

    // The route must not read balances or ownership itself (read-then-write gap)
    const tables = server.from.mock.calls.map((c: string[]) => c[0])
    expect(tables).toEqual(["agents"])
  })

  it("second request after the grant (the race loser) gets 409 from the RPC dedupe", async () => {
    setup({ agent: PAID_AGENT })
    rpcMock.mockResolvedValue({
      data: { ok: true, already_owned: false, credits_spent: 100, new_balance: 900 },
      error: null,
    })
    const first = await call({ useCredits: true })
    expect(first.status).toBe(200)

    rpcMock.mockResolvedValue({
      data: { ok: true, already_owned: true },
      error: null,
    })
    const second = await call({ useCredits: true })
    expect(second.status).toBe(409)
    expect(await second.json()).toEqual({ error: "You already own this agent" })
  })

  it("maps insufficient_credits to 402 with required/available", async () => {
    setup({ agent: PAID_AGENT })
    rpcMock.mockResolvedValue({
      data: { ok: false, error: "insufficient_credits", required: 100, available: 40 },
      error: null,
    })
    const res = await call({ useCredits: true })
    expect(res.status).toBe(402)
    expect(await res.json()).toEqual({
      error: "Insufficient credits",
      required: 100,
      available: 40,
    })
  })

  it("maps agent_not_found from the RPC to 404", async () => {
    setup({ agent: PAID_AGENT })
    rpcMock.mockResolvedValue({
      data: { ok: false, error: "agent_not_found" },
      error: null,
    })
    const res = await call({ useCredits: true })
    expect(res.status).toBe(404)
  })

  it("returns 500 when the RPC call fails", async () => {
    setup({ agent: PAID_AGENT })
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } })
    const res = await call({ useCredits: true })
    expect(res.status).toBe(500)
  })

  it("paid agent without useCredits goes to Stripe and never calls the RPC", async () => {
    setup({ agent: PAID_AGENT })
    const res = await call({ useCredits: false })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Payment processing not configured" })
    expect(rpcMock).not.toHaveBeenCalled()
  })
})
