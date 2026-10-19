import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"

import { POST } from "@/app/api/builder/generate/route"

const INTERNAL_SECRET =
  "GROQ_API_KEY=sk-super-secret upstream https://api.groq.com/v1 refused the connection (ECONNREFUSED)"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn(async () => ({
    success: true,
    remaining: 9,
    resetTime: Date.now() + 60000,
  })),
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 9,
    resetTime: Date.now() + 60000,
    retryAfter: 0,
  })),
  getClientIdentifier: vi.fn(() => "test-client"),
}))
vi.mock("@/lib/builder/utils/prompt-enhancer", () => ({
  enhanceToHighLevelWebsitePrompt: vi.fn(async (prompt: string) => prompt),
}))
vi.mock("@/lib/builder/utils/prompt-analysis", () => ({
  analyzePrompt: vi.fn(async () => ({
    intent: "create",
    websiteType: "other",
    features: [],
    colorScheme: null,
    complexity: "simple",
    referenceUrl: null,
    clarifyingQuestions: [],
  })),
}))
vi.mock("@/lib/builder/utils/web-search", () => ({
  searchWeb: vi.fn(async () => []),
}))
vi.mock("@/lib/builder/utils/builder-image", () => ({
  getImagePromptsForWebsite: vi.fn(() => []),
  generateImageUrlForBuilder: vi.fn(async () => null),
}))
vi.mock("@/lib/ai/builder-generate-fallback", () => ({
  generateForBuilder: vi.fn(async () => ({ text: "" })),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")
const { enhanceToHighLevelWebsitePrompt } = await import("@/lib/builder/utils/prompt-enhancer")
const { generateForBuilder } = await import("@/lib/ai/builder-generate-fallback")

const userId = "00000000-0000-0000-0000-000000000001"

function postRequest() {
  return new NextRequest("http://localhost/api/builder/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "a portfolio site for a designer" }),
  })
}

function authClient() {
  return { auth: { getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })) } } as any
}

describe("POST /api/builder/generate (F35 internal error leak)", () => {
  beforeAll(() => {
    process.env.NAIRI_AI_BASE_URL = "https://tunnel.trycloudflare.com/v1"
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
    vi.mocked(createClient).mockResolvedValue(authClient())
    vi.mocked(enhanceToHighLevelWebsitePrompt).mockImplementation(async (prompt: string) => prompt)
    vi.mocked(generateForBuilder).mockImplementation(async () => ({ text: "" }) as any)
  })

  it("returns a generic 500 without internal details when a dependency throws", async () => {
    vi.mocked(getUserIdForApi).mockRejectedValue(new Error(INTERNAL_SECRET))

    const res = await POST(postRequest())

    expect(res.status).toBe(500)
    const raw = JSON.stringify(await res.json())
    expect(raw).not.toContain(INTERNAL_SECRET)
    expect(raw).not.toContain("sk-super-secret")
    expect(raw).not.toContain("stack")
    expect(raw).toMatch(/internal server error/i)
  })

  it("does not leak internal details in the event stream when a stream dependency throws", async () => {
    vi.mocked(enhanceToHighLevelWebsitePrompt).mockRejectedValue(new Error(INTERNAL_SECRET))

    const res = await POST(postRequest())

    expect(res.status).toBe(200)
    const stream = await res.text()
    expect(stream).toContain('"type":"error"')
    expect(stream).not.toContain(INTERNAL_SECRET)
    expect(stream).not.toContain("sk-super-secret")
    expect(stream).not.toContain("ECONNREFUSED")
  })

  it("does not leak upstream LLM provider errors when generation fails", async () => {
    vi.mocked(generateForBuilder).mockRejectedValue(new Error(INTERNAL_SECRET))

    const res = await POST(postRequest())

    expect(res.status).toBe(200)
    const stream = await res.text()
    expect(stream).toContain('"type":"message"')
    expect(stream).not.toContain(INTERNAL_SECRET)
    expect(stream).not.toContain("sk-super-secret")
    expect(stream).not.toContain("api.groq.com")
    expect(stream).not.toContain("Preview error")
  })
})
