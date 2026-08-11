import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/nairi/chat/route"

const mockUserId = "00000000-0000-0000-0000-000000000001"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  getUserIdForApi: vi.fn(),
}))

vi.mock("@/lib/nairi-api/config", () => ({
  isNairiConfigured: vi.fn(() => true),
  getNairiChatUrl: vi.fn(() => "https://test.nairi.ai/chat"),
  NAIRI_CHAT_TIMEOUT_MS: 60000,
}))

vi.mock("@/lib/nairi-api/types", () => ({
  isNairiChatResponse: vi.fn((data: any) => data && typeof data.response === "string"),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")

describe("POST /api/nairi/chat", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null } }),
      },
    } as any)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    const res = await POST(
      new NextRequest("http://localhost/api/nairi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
      })
    )
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe("Unauthorized")
  })

  it("returns 400 when no messages provided", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(mockUserId)
    const res = await POST(
      new NextRequest("http://localhost/api/nairi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      })
    )
    expect(res.status).toBe(400)
  })
})