import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the IndexedDB wrapper so we can test the cache/SM-2 loops without a real DB.
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
  },
  idbGet: vi.fn(async (_store: string, key: unknown) => {
    const k = Array.isArray(key) ? key.join("|") : String(key)
    return store.get(k)
  }),
  idbPut: vi.fn(async (_store: string, value: any) => {
    const key = Array.isArray(value?.book_id)
      ? value.book_id
      : [value.book_id, value.concept_id]
    store.set(key.join("|"), value)
  }),
}))

// Mock Zen so exercises are deterministic and offline.
const fakeExercises = [
  {
    type: "mc",
    prompt: "What is a force?",
    options: ["A push or pull", "A color", "A sound", "A taste"],
    correct: "A push or pull",
    explanation: "The chapter states a force is a push or pull.",
  },
]
vi.mock("@/lib/nairibook/zen", () => ({
  callZen: vi.fn(async () => ({ content: "", parsed: { exercises: fakeExercises } })),
}))

import { getExerciseSet, gradeLocally, shouldRegenerateVariant } from "@/lib/nairibook/exercises"
import { review, getNextConcepts, isUnlocked, lessonQuality, loadSM2, saveSM2 } from "@/lib/nairibook/srs"
import type { Concept, ConceptGraph } from "@/lib/nairibook/types"

const concept: Concept = {
  concept_id: "concept-0-1",
  title: "Force",
  description: "A push or pull.",
  chapter: 0,
  source_chunk_ids: ["c-0-0"],
}

const graph: ConceptGraph = {
  concepts: [concept],
  edges: [{ concept_id: "concept-0-1", depends_on: [] }],
  topological_order: ["concept-0-1"],
  cycle_breaks: [],
}

describe("exercises + SM-2 MC loop (small scale)", () => {
  beforeEach(() => store.clear())

  it("generates an MC exercise from the source and caches it per concept", async () => {
    const set = await getExerciseSet("book-1", concept, "Force is a push or pull.")
    expect(set.exercises.length).toBe(1)
    expect(set.exercises[0].type).toBe("mc")
    expect(set.exercises[0].correct).toBe("A push or pull")

    // Second call should hit the cache, not regen (reviewCount=0).
    const set2 = await getExerciseSet("book-1", concept, "Force is a push or pull.")
    expect(set2.variant).toBe(set.variant)
    expect(set2.created_at).toBe(set.created_at)
  })

  it("grades an MC answer locally without LLM", () => {
    const ex = { ...fakeExercises[0], id: "ex-1", concept_id: "concept-0-1" } as any
    expect(gradeLocally(ex, "A push or pull")).toBe(true)
    expect(gradeLocally(ex, "A color")).toBe(false)
  })

  it("SM-2 schedules the next review later for good performance", () => {
    let st = review(undefined, 5) // perfect first pass
    expect(st.repetitions).toBe(1)
    expect(st.interval).toBe(1)
    const first = st.next_review_date

    st = review(st, 5)
    expect(st.repetitions).toBe(2)
    expect(st.interval).toBe(6)
    expect(st.next_review_date).toBeGreaterThan(first)

    st = review(st, 5)
    expect(st.interval).toBeGreaterThan(6) // interval * EF
    expect(st.ease_factor).toBeGreaterThan(2.5)
  })

  it("SM-2 resets on failure (quality < 3)", () => {
    let st = review(undefined, 5)
    st = review(st, 5)
    expect(st.repetitions).toBe(2)
    st = review(st, 1) // fail
    expect(st.repetitions).toBe(0)
    expect(st.interval).toBe(1)
  })

  it("full loop: generate -> pass -> SM-2 -> due review is prioritized", async () => {
    // 1. Generate + cache
    const set = await getExerciseSet("book-1", concept, "Force is a push or pull.")
    // 2. Learner answers all correct locally
    const allCorrect = set.exercises.every((e) => gradeLocally(e, e.correct ?? e.answer))
    expect(allCorrect).toBe(true)
    // 3. Update SM-2 from lesson quality
    const q = lessonQuality(set.exercises.length, set.exercises.length)
    const st = review(undefined, q)
    st.book_id = "book-1"
    st.concept_id = "concept-0-1"
    await saveSM2(st)
    // 4. Persisted state reloads
    const loaded = await loadSM2("book-1", "concept-0-1")
    expect(loaded?.next_review_date).toBeGreaterThan(Date.now())
    // 5. Scheduler: once due, the concept is surfaced as a 'due' review
    const states = new Map<string, any>([[ "concept-0-1", loaded ]])
    const next = getNextConcepts(graph, states, new Set(), loaded!.next_review_date + 1)
    expect(next[0].concept_id).toBe("concept-0-1")
    expect(next[0].due).toBe(true)
  })

  it("dependency gating: a locked concept is not unlocked", () => {
    const g: ConceptGraph = {
      concepts: [
        { concept_id: "a", title: "A", description: "", chapter: 0, source_chunk_ids: [] },
        { concept_id: "b", title: "B", description: "", chapter: 0, source_chunk_ids: [] },
      ],
      edges: [{ concept_id: "b", depends_on: ["a"] }],
      topological_order: ["a", "b"],
      cycle_breaks: [],
    }
    expect(isUnlocked("b", new Set(), g)).toBe(false)
    expect(isUnlocked("b", new Set(["a"]), g)).toBe(true)
  })

  it("shouldRegenerateVariant triggers on period and probabilistically", () => {
    expect(shouldRegenerateVariant(3)).toBe(true)
    expect(shouldRegenerateVariant(6)).toBe(true)
    // reviewCount=1 -> only probabilistic; call many times, expect sometimes true
    const hits = Array.from({ length: 200 }, () => shouldRegenerateVariant(1)).filter(Boolean).length
    expect(hits).toBeGreaterThan(0)
    expect(hits).toBeLessThan(200)
  })

  it("regenerates a new variant on SR review per shouldRegenerateVariant", async () => {
    // Force the probabilistic path: reviewCount=1 (not a period multiple) and
    // Math.random() < VARIANT_PROB so shouldRegenerateVariant returns true.
    const rnd = vi.spyOn(Math, "random").mockReturnValue(0.1)
    const set1 = await getExerciseSet("book-2", concept, "Force is a push or pull.")
    const set2 = await getExerciseSet("book-2", concept, "Force is a push or pull.", { reviewCount: 1 })
    expect(set2.variant).toBe(set1.variant + 1)
    rnd.mockRestore()
  })

  it("grades tf and match locally", () => {
    const tf = { id: "t", concept_id: "c", type: "tf", prompt: "p", statement: "s", answer: true, explanation: "e" } as any
    expect(gradeLocally(tf, true)).toBe(true)
    expect(gradeLocally(tf, false)).toBe(false)

    const match = {
      id: "m", concept_id: "c", type: "match", prompt: "p", explanation: "e",
      pairs: [{ term: "F", definition: "force" }, { term: "E", definition: "energy" }],
    } as any
    expect(gradeLocally(match, match.pairs)).toBe(true)
    expect(gradeLocally(match, [{ term: "F", definition: "energy" }, { term: "E", definition: "force" }])).toBe(false)
  })
})

