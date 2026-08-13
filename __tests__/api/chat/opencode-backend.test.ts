import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Live integration test for the OpenCode backend path of /api/chat.
// Requires a reachable opencode server (OPENCODE_API_URL) — the default model
// is opencode/big-pickle (see opencode.json "model"). If no server is up the
// suite is skipped rather than failing CI.

const OPENCODE_URL = process.env.OPENCODE_API_URL ?? "http://127.0.0.1:4096"

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(`${OPENCODE_URL}/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  getUserIdForApi: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn(() => Promise.resolve({ success: true })),
  getClientIdentifier: vi.fn(() => "opencode-test-client"),
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

import { POST } from "@/app/api/chat/route"

const mockUserId = "00000000-0000-0000-0000-000000000001"

function chain() {
  const next = {
    select: () => next,
    eq: () => next,
    lt: () => next,
    not: () => Promise.resolve({ data: [], error: null }),
    order: () => Promise.resolve({ data: [], error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ error: null }),
    update: () => next,
  }
  return next
}

const isUp = await serverUp()

describe.skipIf(!isUp)("POST /api/chat - OpenCode backend (live)", () => {
  const orig = { ...process.env }

  beforeEach(() => {
    // Force the OpenCode backend and disable all others.
    process.env.OPENCODE_API_URL = OPENCODE_URL
    delete process.env.COLAB_AI_BASE_URL
    delete process.env.NAIRI_AI_BASE_URL
    delete process.env.OLLAMA_BASE_URL
    delete process.env.NAIRI_ROUTER_BASE_URL
    vi.mocked(getUserIdForApi).mockResolvedValue(mockUserId)
    const mockSupabase = {
      from: () => chain(),
      auth: { getUser: () => Promise.resolve({ data: { user: { id: mockUserId } }, error: null }) },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  afterEach(() => {
    process.env = { ...orig }
  })

  it("generates text via opencode/big-pickle and streams it back", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Reply with exactly two words: hello world" }],
          stream: true,
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.text()
    // AI SDK UI stream format (SSE): `data: {"type":"text-delta",...}\n\ndata: [DONE]\n\n`
    const parsed = body
      .split("\n")
      .filter((l) => l.startsWith("data: ") && !l.includes("[DONE]"))
      .map((l) => JSON.parse(l.slice(6)))
    const deltas = parsed.filter((p: any) => p.type === "text-delta").map((p: any) => p.delta)
    const full = deltas.join("")
    expect(full.length).toBeGreaterThan(0)
    expect(full.toLowerCase()).toContain("hello world")
  })

  it("reuses the OpenCode session per conversation", async () => {
    let sessionCreated = false
    const spy = vi.fn()
    const realFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (url: any, init: any) => {
      const u = String(url)
      if (u.endsWith("/session") && init?.method === "POST") sessionCreated = true
      if (u.includes("/message")) spy()
      return realFetch(url, init)
    }) as unknown as typeof fetch

    const request = () =>
      POST(
        new NextRequest("http://localhost/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: "conv-test-1",
            messages: [{ role: "user", content: "Say hi" }],
          }),
        })
      )

    await request()
    expect(sessionCreated).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
    globalThis.fetch = realFetch
  }, 120000)
})
