import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/credits/earn/route"

const mockUserId = "00000000-0000-0000-0000-000000000001"

const rpcMock = vi.fn()
const getUserMock = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/security/request-validator", () => ({
  assertSameOrigin: vi.fn(() => null),
}))

const { createClient } = await import("@/lib/supabase/server")

function post(body: unknown) {
  return new NextRequest("http://localhost/api/credits/earn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/credits/earn (F25 atomic reward)", () => {
  beforeEach(() => {
    rpcMock.mockReset()
    getUserMock.mockReset()
    getUserMock.mockResolvedValue({ data: { user: { id: mockUserId } } })
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock },
      rpc: rpcMock,
    } as any)
  })

  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await POST(post({ rewardType: "watch" }))
    expect(res.status).toBe(401)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("rejects invalid reward types before touching the database", async () => {
    const res = await POST(post({ rewardType: "marketplace" }))
    expect(res.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("maps an already-claimed unique violation to alreadyClaimed", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, already_claimed: true },
      error: null,
    })
    const res = await POST(post({ rewardType: "watch" }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.alreadyClaimed).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith("earn_daily_reward", {
      p_user_id: mockUserId,
      p_reward_type: "watch",
      p_metadata: {},
    })
  })

  it("returns balance and streak on success", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, already_claimed: false, credits_earned: 50, new_balance: 1050, streak: 3 },
      error: null,
    })
    const res = await POST(post({ rewardType: "watch" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.creditsEarned).toBe(50)
    expect(data.newBalance).toBe(1050)
    expect(data.streak).toBe(3)
  })

  it("drops oversized metadata instead of persisting it", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, already_claimed: false, credits_earned: 25, new_balance: 1025, streak: 1 },
      error: null,
    })
    const bigMetadata = { blob: "x".repeat(5000) }
    const res = await POST(post({ rewardType: "activity", metadata: bigMetadata }))
    expect(res.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith("earn_daily_reward", {
      p_user_id: mockUserId,
      p_reward_type: "activity",
      p_metadata: {},
    })
  })

  it("returns 500 when the RPC errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } })
    const res = await POST(post({ rewardType: "streak" }))
    expect(res.status).toBe(500)
  })
})
