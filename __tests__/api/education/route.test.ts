import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

vi.mock("@/lib/ai/groq-direct", () => ({
  generateWithFallback: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

const { generateWithFallback } = await import("@/lib/ai/groq-direct")

const { createClient } = await import("@/lib/supabase/server")

import { makeSupabaseClient, setMockUser } from "@/__tests__/utils/mock-supabase"

const supabase = makeSupabaseClient({})
vi.mocked(createClient).mockResolvedValue(supabase.client)
setMockUser(supabase, { id: "00000000-0000-0000-0000-000000000001" })

import { GET, POST } from "@/app/api/education/route"

function post(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/education", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const HANDLERS: Array<{
  action: string
  body: Record<string, unknown>
  failureError: string
  provider: string
  successKey: string
}> = [
  {
    action: "tutor",
    body: { action: "tutor", subject: "Math", question: "What is 2+2?", level: "beginner" },
    failureError: "Tutor service unavailable",
    provider: "nairi-tutor",
    successKey: "response",
  },
  {
    action: "explain",
    body: { action: "explain", topic: "Photosynthesis", depth: "detailed" },
    failureError: "Explanation service unavailable",
    provider: "nairi-explainer",
    successKey: "explanation",
  },
  {
    action: "generate-quiz",
    body: { action: "generate-quiz", topic: "World War II", count: 5, difficulty: "medium" },
    failureError: "Quiz generation unavailable",
    provider: "nairi-quiz-generator",
    successKey: "quiz",
  },
  {
    action: "homework-help",
    body: { action: "homework-help", problem: "Solve for x", subject: "Algebra" },
    failureError: "Homework help unavailable",
    provider: "nairi-homework-helper",
    successKey: "guidance",
  },
  {
    action: "practice",
    body: { action: "practice", topic: "Calculus", count: 3, difficulty: "medium" },
    failureError: "Practice generation unavailable",
    provider: "nairi-practice-generator",
    successKey: "problems",
  },
  {
    action: "flashcards",
    body: { action: "flashcards", topic: "Biology", count: 5 },
    failureError: "Flashcard generation unavailable",
    provider: "nairi-flashcard-generator",
    successKey: "flashcards",
  },
  {
    action: "study-plan",
    body: { action: "study-plan", subject: "Spanish", goal: "Speak fluently", timeframe: "4 weeks" },
    failureError: "Study plan creation unavailable",
    provider: "nairi-study-planner",
    successKey: "studyPlan",
  },
]

describe("POST /api/education - provider error mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  for (const h of HANDLERS) {
    it(`returns 502 with the fallback body when ${h.action} provider call throws`, async () => {
      vi.mocked(generateWithFallback).mockRejectedValueOnce(new Error("provider down"))
      const res = await POST(post(h.body))
      expect(res.status).toBe(502)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe(h.failureError)
      expect(body.provider).toBe("fallback")
      expect(generateWithFallback).toHaveBeenCalled()
    })

    it(`returns 200 when ${h.action} succeeds`, async () => {
      vi.mocked(generateWithFallback).mockResolvedValueOnce({ text: "AI generated content", model: "test" })
      const res = await POST(post(h.body))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.provider).toBe(h.provider)
      expect(body[h.successKey]).toBeDefined()
    })
  }

  it("returns 502 when the provider returns an empty text", async () => {
    // callLLM returns "No response generated" for empty text — still a 200 path
    vi.mocked(generateWithFallback).mockResolvedValueOnce({ text: "", model: "test" })
    const res = await POST(post({ action: "tutor", question: "Hi", subject: "Math" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.response).toBe("No response generated")
  })
})

describe("POST /api/education - input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when action is missing", async () => {
    const res = await POST(post({}))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Action is required" })
  })

  it("returns 400 when tutor action lacks a question", async () => {
    const res = await POST(post({ action: "tutor", subject: "Math" }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Question is required" })
  })

  it("returns 400 when explain action lacks a topic", async () => {
    const res = await POST(post({ action: "explain" }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Topic is required" })
  })

  it("returns 400 for an unknown action", async () => {
    const res = await POST(post({ action: "nonsense" }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Unknown action: nonsense" })
  })

  it("returns 400 when study-plan lacks subject or goal", async () => {
    const res = await POST(post({ action: "study-plan", subject: "Spanish" }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Subject and goal are required" })
  })
})

describe("GET /api/education", () => {
  it("returns the available tools metadata", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tools).toHaveLength(7)
    expect(body.tools.map((t: { id: string }) => t.id)).toEqual([
      "ai-tutor",
      "explain",
      "quiz",
      "homework-help",
      "practice",
      "flashcards",
      "study-plan",
    ])
    expect(body.academicIntegrity.policy).toBeDefined()
  })
})

describe("POST /api/education - authentication", () => {
  it("rejects unauthenticated requests with 401", async () => {
    ;(supabase.auth.getUser as Mock).mockResolvedValueOnce({ data: { user: null }, error: null })
    const res = await POST(post({ action: "tutor", question: "Hi", subject: "Math" }))
    expect(res.status).toBe(401)
    expect(generateWithFallback).not.toHaveBeenCalled()
  })

  it("processes authenticated requests", async () => {
    vi.mocked(generateWithFallback).mockResolvedValueOnce({ text: "reply", model: "test" })
    const res = await POST(post({ action: "tutor", question: "Hi", subject: "Math" }))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })
})
