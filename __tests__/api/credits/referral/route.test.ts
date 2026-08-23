import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/credits/referral/route"

const mockUserId = "00000000-0000-0000-0000-000000000001"

const rpcMock = vi.fn()
const getUserMock = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import("@/lib/supabase/server")

function post(body: unknown) {
  return new Request("http://localhost/api/credits/referral", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/credits/referral (F25 atomic claim)", () => {
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
    const res = await POST(post({ referralCode: "NAIRI-ABC12345" }))
    expect(res.status).toBe(401)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("returns 400 when referral code missing", async () => {
    const res = await POST(post({}))
    expect(res.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("maps invalid_code to 404", async () => {
    rpcMock.mockResolvedValue({ data: { ok: false, error: "invalid_code" }, error: null })
    const res = await POST(post({ referralCode: "NAIRI-NOPE" }))
    expect(res.status).toBe(404)
  })

  it("maps self_referral to 400", async () => {
    rpcMock.mockResolvedValue({ data: { ok: false, error: "self_referral" }, error: null })
    const res = await POST(post({ referralCode: "NAIRI-SELF" }))
    expect(res.status).toBe(400)
  })

  it("maps already_referred to 400", async () => {
    rpcMock.mockResolvedValue({ data: { ok: false, error: "already_referred" }, error: null })
    const res = await POST(post({ referralCode: "NAIRI-DUP" }))
    expect(res.status).toBe(400)
  })

  it("delegates to claim_referral and succeeds", async () => {
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null })
    const res = await POST(post({ referralCode: "NAIRI-GOOD" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith("claim_referral", {
      p_referred_id: mockUserId,
      p_referral_code: "NAIRI-GOOD",
    })
  })
})
