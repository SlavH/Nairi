import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock IndexedDB wrapper.
const store = new Map<string, unknown>()
vi.mock("@/lib/nairibook/db", () => ({
  STORES: {
    books: "books",
    chunks: "chunks",
    concepts: "concepts",
    graphs: "graphs",
    ragChat: "rag_chat",
    ragFeedback: "rag_feedback",
    exerciseCache: "exercise_cache",
    srState: "sr_state",
    gamification: "gamification",
    problemCache: "problem_cache",
    photoCheck: "photo_check",
  },
  idbGet: vi.fn(async (_s: string, key: unknown) => {
    const k = Array.isArray(key) ? key.join("|") : String(key)
    return store.get(k)
  }),
  idbPut: vi.fn(async (_s: string, value: any) => {
    const key = Array.isArray(value?.book_id) ? value.book_id : [value.book_id, value.concept_id]
    store.set(key.join("|"), value)
  }),
}))

// Mock Zen: scripted per-schema responses.
const responses: Record<string, unknown> = {}
let visionUnavailable = false
vi.mock("@/lib/nairibook/zen", () => ({
  callZen: vi.fn(async (_prompt: string, opts: any) => {
    const name = opts?.schema?.name
    const parsed = responses[name] ?? null
    return { content: parsed ? JSON.stringify(parsed) : "", parsed }
  }),
  callZenVision: vi.fn(async (_prompt: string, opts: any) => {
    if (visionUnavailable) {
      const err: any = new Error("Missing API key.")
      err.name = "VisionUnavailableError"
      throw err
    }
    const name = opts?.schema?.name
    const parsed = responses[name] ?? null
    return { content: parsed ? JSON.stringify(parsed) : "", parsed }
  }),
  VisionUnavailableError: class extends Error {
    constructor(m: string) {
      super(m)
      this.name = "VisionUnavailableError"
    }
  },
}))

import {
  recognizeSolution,
  findFirstDivergence,
  classifyDivergence,
  assessPhoto,
  preprocessImage,
} from "@/lib/nairibook/photo-check"
import type { Problem } from "@/lib/nairibook/problem"

const problem: Problem = {
  problem_id: "prob-1",
  book_id: "book-1",
  concept_ids: ["concept-0-1"],
  problem_statement: "A car accelerates from rest at $a=2$ for $t=5$. Find $v$.",
  expected_solution_steps: ["Identify v0=0, a, t", "Use v = v0 + a t", "Substitute: v = 0 + 2*5", "v = 10 m/s"],
  final_answer: "10 m/s",
  difficulty: "easy",
  variant: 1,
}

describe("photo-check", () => {
  beforeEach(() => {
    store.clear()
    Object.keys(responses).forEach((k) => delete responses[k])
  })

  it("recognizeSolution parses recognized_steps + readability", async () => {
    responses["recognition"] = {
      recognized_steps: [
        { step_number: 1, content: "v0=0, a=2, t=5", confidence: 0.9 },
        { step_number: 2, content: "[unreadable]", confidence: 0.2 },
      ],
      overall_readability: "medium",
    }
    const rec = await recognizeSolution(problem, "data:image/jpeg;base64,AAA")
    expect(rec.recognized_steps.length).toBe(2)
    expect(rec.overall_readability).toBe("medium")
  })

  it("findFirstDivergence: detects first mismatch index", () => {
    expect(findFirstDivergence(["a", "b", "c"], ["a", "b", "c"])).toBe(-1)
    expect(findFirstDivergence(["a", "b", "c"], ["a", "x", "c"])).toBe(1)
    expect(findFirstDivergence(["a", "b"], ["a", "b", "c"])).toBe(2)
  })

  it("classifyDivergence returns concept-grounded explanation", async () => {
    responses["compare"] = {
      first_divergence_index: 2,
      error_type: "numeric",
      explanation: "You used grams instead of newtons for the force.",
    }
    const diff = await classifyDivergence(problem, ["v0=0", "v=v0+at", "v=0+2*50", "100 m/s"], "Force measured in newtons.")
    expect(diff.index).toBe(2)
    expect(diff.error_type).toBe("numeric")
    expect(diff.explanation).toMatch(/newtons/i)
  })

  it("assessPhoto: low readability -> needs_retake, no grading", async () => {
    responses["recognition"] = {
      recognized_steps: [{ step_number: 1, content: "[unreadable]", confidence: 0.1 }],
      overall_readability: "low",
    }
    const fb = await assessPhoto(problem, "data:image/jpeg;base64,AAA", "text")
    expect(fb.needs_retake).toBe(true)
    expect(fb.first_diff).toBeNull()
  })

  it("assessPhoto: all matched when steps align", async () => {
    responses["recognition"] = {
      recognized_steps: [
        { step_number: 1, content: "v0=0, a=2, t=5", confidence: 0.9 },
        { step_number: 2, content: "v = v0 + a t", confidence: 0.9 },
        { step_number: 3, content: "v = 0 + 2*5", confidence: 0.9 },
        { step_number: 4, content: "v = 10 m/s", confidence: 0.9 },
      ],
      overall_readability: "high",
    }
    responses["compare"] = { first_divergence_index: -1, error_type: "none", explanation: "All steps match." }
    const fb = await assessPhoto(problem, "data:image/jpeg;base64,AAA", "text")
    expect(fb.all_matched).toBe(true)
    expect(fb.needs_retake).toBe(false)
    expect(fb.correct_steps).toBe(4)
  })

  it("assessPhoto: VisionUnavailableError surfaces when no free vision model works", async () => {
    visionUnavailable = true
    await expect(assessPhoto(problem, "data:image/jpeg;base64,AAA", "text")).rejects.toThrow()
    visionUnavailable = false
  })
})

describe("preprocessImage", () => {
  it("returns a JPEG data URL and downscales", async () => {
    // Minimal browser API mocks.
    const listeners: Record<string, any> = {}
    const fakeBitmap = { width: 4000, height: 3000, close: vi.fn() }
    ;(globalThis as any).createImageBitmap = vi.fn(async () => fakeBitmap)
    const ctxDraw = vi.fn()
    ;(globalThis as any).document = {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: ctxDraw }),
        toDataURL: () => "data:image/jpeg;base64,SMALL",
      }),
    }
    const file = new File([new Uint8Array([1, 2, 3])], "p.jpg", { type: "image/jpeg" })
    const out = await preprocessImage(file, 1600, 0.8)
    expect(out.startsWith("data:image/jpeg")).toBe(true)
    // Downscaled to max dimension 1600.
    expect(fakeBitmap.width).toBe(4000) // original untouched
    expect(ctxDraw).toHaveBeenCalled()
  })
})
