import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/chat/route"

const mockUserId = "00000000-0000-0000-0000-000000000001"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  getUserIdForApi: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn(() => Promise.resolve({ success: true })),
  getClientIdentifier: vi.fn(() => "test-client"),
  RATE_LIMITS: { chat: { maxRequests: 100, windowMs: 60000 } },
}))

vi.mock("@/lib/security/request-validator", () => ({
  MAX_REQUEST_SIZES: { chat: 100 * 1024, builder: 500 * 1024, upload: 10 * 1024 * 1024, default: 1 * 1024 * 1024 },
  validateRequestSize: vi.fn(() => Promise.resolve({ valid: true })),
  validateContentType: vi.fn(() => ({ valid: true })),
  assertSameOrigin: vi.fn(() => null),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        insert: () => Promise.resolve({ error: null }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null } }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    try {
      const res = await POST(
        new NextRequest("http://localhost/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
        })
      )
      console.log('Response status:', res.status)
      const text = await res.text()
      console.log('Response body:', text)
      expect(res.status).toBe(401)
      const data = JSON.parse(text)
      expect(data.error).toBe("Unauthorized")
    } catch (err) {
      console.error('Test error:', err)
      throw err
    }
  })

  it("returns 400 when messages array is empty", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(mockUserId)
    const res = await POST(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      })
    )
    expect(res.status).toBe(400)
  })
})