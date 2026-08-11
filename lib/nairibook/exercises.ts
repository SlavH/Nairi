// NairiBook exercise generator + local cache.
//
// Exercises are generated per concept from the chapter's source chunks (the
// concept's source_chunk_ids already point at the whole chapter). Generation is
// lazy and cached in IndexedDB keyed by [book_id, concept_id]. To avoid rote
// memorization of the exact question wording, SR reviews occasionally
// regenerate a fresh variant (see shouldRegenerateVariant).
//
// Types: mc (multiple choice), fill (fill-in-the-blank, free text),
//        match (term/definition pairs), tf (true/false with explanation).

import { callZen } from "./zen"
import { idbGet, idbPut, STORES } from "./db"
import type { Concept } from "./types"

export type ExerciseType = "mc" | "fill" | "match" | "tf"

export interface Exercise {
  id: string // `ex-{concept_id}-{n}`
  concept_id: string
  type: ExerciseType
  prompt: string
  // mc
  options?: string[]
  correct?: string
  // tf
  statement?: string
  answer?: boolean
  // match
  pairs?: { term: string; definition: string }[]
  // shared
  explanation: string // why the answer is correct, grounded in the source
  reference?: string // canonical answer for fill (used by LLM grading)
}

export interface ExerciseSet {
  book_id: string
  concept_id: string
  exercises: Exercise[]
  variant: number // bumped on each regeneration
  created_at: number
}

// Probability (and period) for regenerating a fresh exercise variant on an SR
// review. We regenerate if the review is the 3rd/6th/... repetition OR a coin
// flip at VARIANT_PROB succeeds — whichever comes first — so repeats stay fresh
// without hammering the LLM every time.
const VARIANT_PROB = 0.4
const VARIANT_PERIOD = 3

export function shouldRegenerateVariant(reviewCount: number): boolean {
  if (reviewCount > 0 && reviewCount % VARIANT_PERIOD === 0) return true
  return Math.random() < VARIANT_PROB
}

// ----- JSON schema sent to Zen (strict) -----
// One exercise per requested type is returned; we ask for a small set.
export const EXERCISE_SCHEMA = {
  name: "exercise_set",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      exercises: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string", enum: ["mc", "fill", "match", "tf"] },
            prompt: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correct: { type: "string" },
            statement: { type: "string" },
            answer: { type: "boolean" },
            pairs: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: { term: { type: "string" }, definition: { type: "string" } },
                required: ["term", "definition"],
              },
            },
            explanation: { type: "string" },
            reference: { type: "string" },
          },
          required: ["type", "prompt", "explanation"],
        },
      },
    },
    required: ["exercises"],
  },
} as const

function buildGenerationPrompt(concept: Concept, chapterText: string): string {
  const allowed = ["mc", "fill", "match", "tf"].join(", ")
  return [
    "You are an author of study exercises for a spaced-repetition app.",
    "Generate a set of 4 exercises about the concept below, covering these types: " + allowed + ".",
    "RULES:",
    "- Base every exercise STRICTLY on the source chapter text provided. Do not use outside knowledge.",
    "- For 'mc': provide 4 'options' (one is correct) and set 'correct' to the right option string.",
    "- For 'fill': 'prompt' has a '____' blank; 'correct' is the missing term; 'reference' is a canonical one-line answer.",
    "- For 'match': 'pairs' is 3-4 {term, definition} objects; the learner matches them.",
    "- For 'tf': 'statement' is a claim; 'answer' is true/false; always include a short 'explanation' grounded in the text.",
    "- 'explanation' must justify the correct answer using the source (no generic praise).",
    "",
    "CONCEPT: " + concept.title,
    "DESCRIPTION: " + concept.description,
    "",
    "SOURCE CHAPTER TEXT:",
    chapterText.slice(0, 12000),
  ].join("\n")
}

function normalizeExercises(raw: unknown, concept: Concept, variant: number): Exercise[] {
  const arr = (raw as { exercises?: unknown[] })?.exercises ?? []
  return arr.map((e, i): Exercise => {
    const ex = e as Record<string, unknown>
    return {
      id: `ex-${concept.concept_id}-${variant}-${i}`,
      concept_id: concept.concept_id,
      type: ex.type as ExerciseType,
      prompt: (ex.prompt as string) ?? "",
      options: ex.options as string[] | undefined,
      correct: ex.correct as string | undefined,
      statement: ex.statement as string | undefined,
      answer: ex.answer as boolean | undefined,
      pairs: ex.pairs as { term: string; definition: string }[] | undefined,
      explanation: (ex.explanation as string) ?? "",
      reference: ex.reference as string | undefined,
    }
  })
}

export async function generateExercises(
  concept: Concept,
  chapterText: string,
  signal?: AbortSignal
): Promise<Exercise[]> {
  const prompt = buildGenerationPrompt(concept, chapterText)
  const res = await callZen(prompt, { schema: EXERCISE_SCHEMA, temperature: 0.7, maxTokens: 2048, signal })
  // res.parsed holds the JSON when the schema is honored; fall back to an empty set.
  const data = (res.parsed as { exercises?: unknown[] } | undefined) ?? undefined
  return normalizeExercises(data ?? {}, concept, 1)
}

// ----- Cache layer -----

export async function loadExerciseCache(bookId: string, conceptId: string): Promise<ExerciseSet | undefined> {
  return idbGet<ExerciseSet>(STORES.exerciseCache, [bookId, conceptId])
}

export async function saveExerciseCache(set: ExerciseSet): Promise<void> {
  await idbPut(STORES.exerciseCache, set)
}

// Returns the cached set, generating (and caching) it on first access. On an SR
// review (reviewCount > 0) it may regenerate a new variant per shouldRegenerateVariant.
export async function getExerciseSet(
  bookId: string,
  concept: Concept,
  chapterText: string,
  opts: { reviewCount?: number; signal?: AbortSignal } = {}
): Promise<ExerciseSet> {
  const existing = await loadExerciseCache(bookId, concept.concept_id)
  if (existing && !(opts.reviewCount && opts.reviewCount > 0 && shouldRegenerateVariant(opts.reviewCount))) {
    return existing
  }
  const exercises = await generateExercises(concept, chapterText, opts.signal)
  const set: ExerciseSet = {
    book_id: bookId,
    concept_id: concept.concept_id,
    exercises,
    variant: (existing?.variant ?? 0) + 1,
    created_at: Date.now(),
  }
  await saveExerciseCache(set)
  return set
}

// LLM grading for free-text (fill) answers: correct only by meaning, not exact
// string match. Returns {correct, reason}.
export interface FillGrade {
  correct: boolean
  reason: string
}

export async function gradeFillAnswer(
  exercise: Exercise,
  userAnswer: string,
  conceptText: string,
  signal?: AbortSignal
): Promise<FillGrade> {
  const prompt = [
    "A learner answered a fill-in-the-blank exercise. Judge whether their answer is correct BY MEANING, not exact wording.",
    "EXERCISE PROMPT: " + exercise.prompt,
    "CANONICAL ANSWER: " + (exercise.reference ?? exercise.correct ?? ""),
    "CONCEPT CONTEXT: " + conceptText.slice(0, 3000),
    "LEARNER ANSWER: " + userAnswer,
    "Respond STRICTLY with JSON: { \"correct\": boolean, \"reason\": string }",
  ].join("\n")
  const res = await callZen(prompt, {
    schema: {
      name: "fill_grade",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: { correct: { type: "boolean" }, reason: { type: "string" } },
        required: ["correct", "reason"],
      },
    },
    temperature: 0,
    maxTokens: 256,
    signal,
  })
  const parsed = (res.parsed as FillGrade | undefined) ?? undefined
  if (parsed && typeof parsed.correct === "boolean") return parsed
  // Fallback: exact / case-insensitive match against canonical.
  const canon = (exercise.reference ?? exercise.correct ?? "").trim().toLowerCase()
  const user = userAnswer.trim().toLowerCase()
  return { correct: canon.length > 0 && user === canon, reason: "Exact match fallback." }
}

// Local grading for non-free-text types. Returns whether the learner answer is
// correct. No LLM call.
export function gradeLocally(exercise: Exercise, answer: unknown): boolean {
  switch (exercise.type) {
    case "mc":
      return typeof answer === "string" && answer === exercise.correct
    case "tf":
      return typeof answer === "boolean" && answer === exercise.answer
    case "match": {
      // answer: array of {term, definition} in the learner's matched order
      const pairs = exercise.pairs ?? []
      const given = answer as { term: string; definition: string }[]
      if (!Array.isArray(given) || given.length !== pairs.length) return false
      const byTerm = new Map(pairs.map((p) => [p.term, p.definition]))
      return given.every((g) => byTerm.get(g.term) === g.definition)
    }
    default:
      return false
  }
}
