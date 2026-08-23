import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))
vi.mock("@/lib/security/request-validator", () => ({
  assertSameOrigin: vi.fn(() => null),
}))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 9, resetTime: 0, retryAfter: 0 })),
  getClientIdentifier: vi.fn(() => "test-client"),
}))
vi.mock("@/lib/ai/groq-direct", () => ({
  generateWithFallback: vi.fn(async () => ({ text: "answer [1]" })),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")
const { POST } = await import("@/app/api/learn/notebooks/[id]/chat/route")

const userId = "00000000-0000-0000-0000-000000000001"

function makeClient(sources: Array<{ id: string; title: string; content: string }>) {
  const from = vi.fn((table: string) => {
    if (table === "learn_notebooks") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: "nb1" }, error: null }),
            }),
          }),
        }),
      }
    }
    if (table === "learn_notebook_sources") {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: sources, error: null }),
          }),
        }),
      }
    }
    throw new Error("unexpected table: " + table)
  })
  return { client: { from } as any, from }
}

function post(message = "What is this about?") {
  return new NextRequest("http://localhost/api/learn/notebooks/nb1/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

const context = { params: Promise.resolve({ id: "nb1" }) }

describe("POST /api/learn/notebooks/[id]/chat (F24 context budget)", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("caps context to the total budget across many large sources", async () => {
    // 12 sources × 30k chars each — far over the 80k total budget.
    const sources = Array.from({ length: 12 }, (_, i) => ({
      id: `s${i}`,
      title: `Source ${i + 1}`,
      content: "x".repeat(30_000),
    }))
    const { client } = makeClient(sources)
    const capturedSystem: { value?: string } = {}
    const { generateWithFallback } = await import("@/lib/ai/groq-direct")
    vi.mocked(generateWithFallback).mockImplementationOnce(async (input: any) => {
      capturedSystem.value = input.system
      return { text: "ok" } as any
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const res = await POST(post(), context)
    expect(res.status).toBe(200)

    const system = capturedSystem.value ?? ""
    const sourcesSection = system.split("SOURCES:")[1] ?? ""
    // Budget: first 4 sources fill exactly 80k (20k cap each).
    expect((sourcesSection.match(/x/g) ?? []).length).toBeLessThanOrEqual(80_000)
    // At most 10 sources are referenced.
    const sourceHeaders = (sourcesSection.match(/--- Source \[\d+\]/g) ?? []).length
    expect(sourceHeaders).toBeLessThanOrEqual(10)
  })

  it("returns 400 when message is missing", async () => {
    const { client } = makeClient([{ id: "s0", title: "T", content: "c" }])
    vi.mocked(createClient).mockResolvedValue(client as any)
    const res = await POST(post("   "), context)
    expect(res.status).toBe(400)
  })

  it("returns 400 when the notebook has no sources", async () => {
    const { client } = makeClient([])
    vi.mocked(createClient).mockResolvedValue(client as any)
    const res = await POST(post(), context)
    expect(res.status).toBe(400)
  })
})
