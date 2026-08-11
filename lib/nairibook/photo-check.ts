// NairiBook handwritten-solution photo checker.
//
// A student photographs (or uploads) a handwritten solution; a vision model
// transcribes the steps, we compare them to the problem's expected_solution_steps
// (reused from the Socratic tutor), and return feedback that pinpoints the FIRST
// divergence with a concept-grounded explanation. If the active model lacks
// vision, VisionUnavailableError is thrown, prompting for a BYOK key.

import { callZen, callZenVision, VisionUnavailableError, type ZenOptions } from "./zen"

export { VisionUnavailableError }
import { idbGet, idbPut, STORES } from "./db"
import type { Problem } from "./problem"

export type Readability = "low" | "medium" | "high"
export type ErrorType = "numeric" | "formula" | "missing" | "extra" | "order" | "none"

export interface RecognizedStep {
  step_number: number
  content: string
  confidence: number // 0..1
}

export interface RecognitionResult {
  recognized_steps: RecognizedStep[]
  overall_readability: Readability
}

export interface StepDiff {
  index: number // index into expected_solution_steps
  expected: string
  recognized: string
  error_type: ErrorType
  explanation: string
}

export interface PhotoFeedback {
  needs_retake: boolean // true when readability too low to grade reliably
  correct_steps: number // how many leading steps matched before first divergence
  first_diff: StepDiff | null
  all_matched: boolean
}

// ----- Image preprocessing (browser-native, no deps) -----
// Reads a file, fixes EXIF orientation, downscales to maxDim, returns JPEG
// data-URL. Reduces payload size and improves recognition quality.
export async function preprocessImage(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  let { width, height } = bitmap
  const scale = Math.min(1, maxDim / Math.max(width, height))
  width = Math.round(width * scale)
  height = Math.round(height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", quality)
}

// ----- Recognition schema -----
export const RECOGNIZE_SCHEMA = {
  name: "recognition",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      recognized_steps: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            step_number: { type: "integer" },
            content: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["step_number", "content", "confidence"],
        },
      },
      overall_readability: { type: "string", enum: ["low", "medium", "high"] },
    },
    required: ["recognized_steps", "overall_readability"],
  },
} as const

// ----- Comparison schema (text LLM call) -----
export const COMPARE_SCHEMA = {
  name: "compare",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      first_divergence_index: { type: "integer" },
      error_type: { type: "string", enum: ["numeric", "formula", "missing", "extra", "order", "none"] },
      explanation: { type: "string" },
    },
    required: ["first_divergence_index", "error_type", "explanation"],
  },
} as const

function buildRecognizePrompt(problem: Problem): string {
  return [
    "You are reading a PHOTOGRAPH of a handwritten solution to a physics/exact-science problem.",
    "Transcribe the student's reasoning steps IN ORDER, preserving formulas and intermediate results.",
    "RULES:",
    "- Output one entry per distinct step the student wrote.",
    "- confidence: 0..1 — how sure you are of the transcription for that step.",
    "- If a fragment is unreadable, write exactly '[unreadable]' for its content and set a low confidence. NEVER invent or guess unreadable math.",
    "- Be honest about uncertainty; do not 'fix' the student's notation.",
    "",
    "PROBLEM (for context only — do NOT solve it yourself):",
    problem.problem_statement,
    "EXPECTED FINAL ANSWER (context only): " + problem.final_answer,
  ].join("\n")
}

function buildComparePrompt(
  expected: string[],
  recognized: string[],
  chapterText: string
): string {
  return [
    "A student's handwritten solution was transcribed step-by-step. Compare it to the expected solution steps.",
    "Find the FIRST index (0-based) where the student's reasoning diverges from the expected path.",
    "Classify the divergence:",
    " - 'numeric': a numerical value is wrong or has wrong units;",
    " - 'formula': an equation/law is wrong or misapplied;",
    " - 'missing': an expected step is skipped;",
    " - 'extra': the student added an unjustified/incorrect step;",
    " - 'order': steps are in the wrong sequence;",
    " - 'none': the student's steps match the expected path (allow equivalent math).",
    "EXPLANATION must be grounded in the SOURCE CONCEPT TEXT below — explain the mistake concretely (e.g. 'you used grams instead of newtons'), not just 'error here'.",
    "",
    "EXPECTED STEPS:",
    expected.map((s, i) => `${i}. ${s}`).join("\n"),
    "",
    "STUDENT STEPS:",
    recognized.map((s, i) => `${i}. ${s}`).join("\n"),
    "",
    "SOURCE CONCEPT TEXT:",
    chapterText.slice(0, 6000),
  ].join("\n")
}

export async function recognizeSolution(
  problem: Problem,
  imageDataUrl: string,
  signal?: AbortSignal
): Promise<RecognitionResult> {
  const res = await callZenVision(buildRecognizePrompt(problem), {
    schema: RECOGNIZE_SCHEMA,
    images: [imageDataUrl],
    temperature: 0.2,
    maxTokens: 1500,
    signal,
  })
  const data = (res.parsed as Partial<RecognitionResult> | undefined) ?? undefined
  if (data && Array.isArray(data.recognized_steps)) {
    return {
      recognized_steps: data.recognized_steps,
      overall_readability: data.overall_readability ?? "medium",
    }
  }
  throw new Error("Failed to parse recognition result")
}

// Pure, deterministic alignment: returns the index of the first recognized step
// that does not match the expected step at the same position. Used as a fast
// pre-check before the (optional) LLM classification.
export function findFirstDivergence(expected: string[], recognized: string[]): number {
  const n = Math.max(expected.length, recognized.length)
  for (let i = 0; i < n; i++) {
    const e = (expected[i] ?? "").trim().toLowerCase()
    const r = (recognized[i] ?? "").trim().toLowerCase()
    if (e !== r) return i
  }
  return -1
}

export async function classifyDivergence(
  problem: Problem,
  recognized: string[],
  chapterText: string,
  signal?: AbortSignal
): Promise<StepDiff> {
  const idx = findFirstDivergence(problem.expected_solution_steps, recognized)
  if (idx === -1) {
    return { index: -1, expected: "", recognized: "", error_type: "none", explanation: "All steps match." }
  }
  const res = await callZen(
    buildComparePrompt(problem.expected_solution_steps, recognized, chapterText),
    { schema: COMPARE_SCHEMA, temperature: 0.2, maxTokens: 600, signal }
  )
  const data = (res.parsed as { first_divergence_index?: number; error_type?: ErrorType; explanation?: string } | undefined) ?? undefined
  const index = typeof data?.first_divergence_index === "number" ? data.first_divergence_index : idx
  return {
    index,
    expected: problem.expected_solution_steps[index] ?? "",
    recognized: recognized[index] ?? "",
    error_type: data?.error_type ?? "none",
    explanation: data?.explanation ?? "Divergence detected at this step.",
  }
}

// Orchestrates the full check. Returns needs_retake when the photo is too unclear
// to grade; otherwise the first divergence (or none) with a concept-grounded note.
export async function assessPhoto(
  problem: Problem,
  imageDataUrl: string,
  chapterText: string,
  signal?: AbortSignal
): Promise<PhotoFeedback> {
  const rec = await recognizeSolution(problem, imageDataUrl, signal)
  if (rec.overall_readability === "low") {
    return { needs_retake: true, correct_steps: 0, first_diff: null, all_matched: false }
  }
  const recognized = rec.recognized_steps.map((s) => s.content)
  const diff = await classifyDivergence(problem, recognized, chapterText, signal)
  const correct_steps = diff.index === -1 ? problem.expected_solution_steps.length : diff.index
  return {
    needs_retake: false,
    correct_steps,
    first_diff: diff.index === -1 ? null : diff,
    all_matched: diff.index === -1,
  }
}

// ----- Cache (optional, per problem) -----
export interface PhotoCheckRecord {
  book_id: string
  problem_id: string
  feedback: PhotoFeedback
  created_at: number
}

async function savePhotoCheck(rec: PhotoCheckRecord): Promise<void> {
  await idbPut(STORES.photoCheck, rec)
}
async function loadPhotoCheck(bookId: string, problemId: string): Promise<PhotoCheckRecord | undefined> {
  return idbGet<PhotoCheckRecord>(STORES.photoCheck, [bookId, problemId])
}
