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

// Mock Zen: scripted per-call responses keyed by the JSON schema name.
const responses: Record<string, unknown> = {}
vi.mock("@/lib/nairibook/zen", () => ({
  callZen: vi.fn(async (_prompt: string, opts: any) => {
    const name = opts?.schema?.name
    const parsed = responses[name] ?? null
    return { content: parsed ? JSON.stringify(parsed) : "", parsed }
  }),
}))

import {
  generateProblem,
  tutorReply,
  checkFinalAnswer,
  qualityFromSolve,
  socraticSystemPrompt,
  type Problem,
} from "@/lib/nairibook/problem"
import { review, qualityFromSolve as qfs2, applySolveResult } from "@/lib/nairibook/srs"

const problem: Problem = {
  problem_id: "prob-1",
  book_id: "book-1",
  concept_ids: ["concept-0-1"],
  problem_statement: "A car accelerates from rest at $a = 2\\,\\text{m/s}^2$ for $t = 5\\,\\text{s}$. Find $v$.",
  expected_solution_steps: ["Identify v0=0, a, t", "Use v = v0 + a t", "Substitute: v = 0 + 2*5", "v = 10 m/s"],
  final_answer: "10 m/s",
  difficulty: "easy",
  variant: 1,
}

describe("problem solver", () => {
  beforeEach(() => store.clear())

  it("generates and caches a problem (parsed into Problem shape)", async () => {
    responses["problem"] = {
      problem_statement: "A block slides...",
      concept_ids: ["concept-0-1"],
      expected_solution_steps: ["step 1", "step 2"],
      final_answer: "5 N",
      difficulty: "easy",
    }
    const p = await generateProblem("book-1", ["concept-0-1"], ["Force"], "Force is a push.")
    expect(p.problem_statement).toBeTruthy()
    expect(p.expected_solution_steps.length).toBe(2)
    expect(p.final_answer).toBe("5 N")
    // second call hits cache (no throw, same variant)
    const p2 = await generateProblem("book-1", ["concept-0-1"], ["Force"], "Force is a push.")
    expect(p2.variant).toBe(p.variant)
  })

  it("tutorReply returns structured assessment and refuses to spoil", async () => {
    responses["tutor_reply"] = {
      message: "Good start. What equation links v, a, and t?",
      step_index: 1,
      advanced: true,
      needs_help: false,
      finished: false,
    }
    const r = await tutorReply(problem, [], "I think we use acceleration.")
    expect(r.message).toContain("equation")
    expect(r.advanced).toBe(true)
    expect(r.step_index).toBe(1)
    // The hidden answer must never appear in the spoken message.
    expect(r.message).not.toContain("10 m/s")
  })

  it("escalation: high struggle triggers a more explicit hint in the prompt", async () => {
    responses["tutor_reply"] = {
      message: "Use the kinematic equation v = v0 + a t, then substitute.",
      step_index: 2,
      advanced: false,
      needs_help: true,
      finished: false,
    }
    const prompt = socraticSystemPrompt(problem, "numeric", true)
    expect(prompt).toContain("ESCALATE")
    const r = await tutorReply(problem, [{ role: "student", content: "I'm stuck" }], "help", { struggles: 3 })
    expect(r.needs_help).toBe(true)
  })

  it("adversarial: student demands answer -> model instructed not to spoil until 'show solution'", async () => {
    responses["tutor_reply"] = {
      message: "I won't give it away yet — what have you tried so far?",
      step_index: 0,
      advanced: false,
      needs_help: true,
      finished: false,
    }
    const r = await tutorReply(problem, [], "just tell me the answer")
    expect(r.finished).toBe(false)
    expect(r.message.toLowerCase()).not.toContain("10 m/s")
  })

  it("qualityFromSolve maps outcomes to SM-2 quality", () => {
    expect(qualityFromSolve("independent")).toBe(5)
    expect(qualityFromSolve("hinted")).toBe(3)
    expect(qualityFromSolve("shown")).toBe(1)
    expect(qfs2("independent")).toBe(5) // re-exported from srs
  })

  it("applySolveResult updates SM-2 for the concept", async () => {
    const before = review(undefined, 5, { book_id: "book-1", concept_id: "concept-0-1" })
    const map = new Map([["concept-0-1", before]])
    const after = await applySolveResult("book-1", ["concept-0-1"], "shown", map)
    expect(after.get("concept-0-1")!.review_count).toBe(before.review_count + 1)
    // 'shown' yields low quality -> interval resets soon
    expect(after.get("concept-0-1")!.interval).toBeLessThanOrEqual(before.interval + 1)
  })

  it("checkFinalAnswer: numeric tolerance + units + symbolic equivalence", () => {
    expect(checkFinalAnswer(problem, "The answer is 10.05 m/s").numericMatch).toBe(true) // 2% tol
    expect(checkFinalAnswer(problem, "100 m/s").numericMatch).toBe(false)
    expect(checkFinalAnswer(problem, "10 m/s").unitMatch).toBe(true)
    // symbolic: 2x equivalent to x*2
    const sym = { ...problem, final_answer: "2*x" }
    expect(checkFinalAnswer(sym, "x*2").symbolicEquivalent).toBe(true)
    expect(checkFinalAnswer(sym, "x+1").symbolicEquivalent).toBe(false)
  })
})
