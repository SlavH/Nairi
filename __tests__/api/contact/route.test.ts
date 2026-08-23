import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/contact/route"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 3, resetTime: 0, retryAfter: 0 })),
  getClientIdentifier: vi.fn(() => "test-client"),
}))

const { createClient } = await import("@/lib/supabase/server")

const rpcMock = vi.fn()

function post(body: unknown) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

const validBody = {
  name: "Jane Doe",
  email: "jane@example.com",
  reason: "support",
  subject: "Help",
  message: "I need help with my account.",
}

describe("POST /api/contact (F27)", () => {
  beforeEach(() => {
    rpcMock.mockReset()
    vi.mocked(createClient).mockResolvedValue({ rpc: rpcMock } as any)
  })

  it("submits via submit_contact_submission RPC (works for anonymous users)", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })
    const res = await POST(post(validBody))
    expect(res.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith("submit_contact_submission", {
      p_name: "Jane Doe",
      p_email: "jane@example.com",
      p_reason: "support",
      p_subject: "Help",
      p_message: "I need help with my account.",
    })
  })

  it("returns 500 when the RPC errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "rls" } })
    const res = await POST(post(validBody))
    expect(res.status).toBe(500)
  })

  it("rejects missing fields without touching the database", async () => {
    const res = await POST(post({ name: "x", email: "not-an-email" }))
    expect(res.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("rejects invalid email format", async () => {
    const res = await POST(post({ ...validBody, email: "nope" }))
    expect(res.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})
