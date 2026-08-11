// NairiBook Socratic problem-solving tutor.
//
// Generates physics/exact-science problems grounded in already-studied concepts,
// then runs a Socratic dialogue where the model never reveals the final answer
// until the student solves it or explicitly asks. Each tutor turn returns a
// structured assessment (step_index / advanced / needs_help / finished) used by
// the UI for step progress and by analytics. The outcome (independent / hinted /
// shown) feeds the existing SM-2 scheduler via qualityFromSolve().

import { idbGet, idbPut, STORES } from "./db"
import type { Concept } from "./types"
import { callZen, type ZenMessage } from "./zen"

export type SolveResult = "independent" | "hinted" | "shown"
type Difficulty = "easy" | "medium" | "hard"

export interface Problem {
  problem_id: string
  book_id: string
  concept_ids: string[]
  problem_statement: string
  expected_solution_steps: string[] // hidden from the student; reference only
  final_answer: string
  difficulty: Difficulty
  variant: number
}

export interface TutorTurn {
  role: "system" | "student" | "tutor"
  content: string
  step_index?: number
  advanced?: boolean
  needs_help?: boolean
}

export interface TutorReply {
  message: string
  step_index: number
  advanced: boolean
  needs_help: boolean
  finished: boolean
}

// ----- Generation schema -----
const PROBLEM_SCHEMA = {
  name: "problem",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      problem_statement: { type: "string" },
      concept_ids: { type: "array", items: { type: "string" } },
      expected_solution_steps: { type: "array", items: { type: "string" } },
      final_answer: { type: "string" },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    },
    required: ["problem_statement", "concept_ids", "expected_solution_steps", "final_answer", "difficulty"],
  },
} as const

// ----- Tutor reply schema (per student message) -----
const TUTOR_REPLY_SCHEMA = {
  name: "tutor_reply",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      message: { type: "string" },
      step_index: { type: "integer" },
      advanced: { type: "boolean" },
      needs_help: { type: "boolean" },
      finished: { type: "boolean" },
    },
    required: ["message", "step_index", "advanced", "needs_help", "finished"],
  },
} as const

// Probability (and period) for regenerating a fresh problem variant on practice.
const VARIANT_PROB = 0.4
const VARIANT_PERIOD = 3

// ----- Socratic system prompt (the fragile core) -----
// Three flavors; the caller picks per problem type. All share the core rule set:
// never reveal the final answer, guide one step at a time, escalate on struggle.
const SOCRATIC_CORE = (
  problem: Problem,
  escalate: boolean
) => `You are a Socratic tutor for physics and exact sciences. Your ONLY goal is to help the student DERIVE the solution themselves. You MUST NOT reveal the final numerical/algebraic answer or a full worked solution unless the student explicitly types "show solution" or "я сдаюсь" (I give up).

HIDDEN REFERENCE — never quote, summarize, or reveal any part of it to the student:
PROBLEM:
${problem.problem_statement}
EXPECTED SOLUTION STEPS:
${problem.expected_solution_steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
FINAL ANSWER: ${problem.final_answer}

For EVERY student message, internally decide:
- step_index: which expected step (0-based) the student is currently working on.
- advanced: did this message move them closer to the NEXT step?
- needs_help: are they wrong or stuck on the current step for the 2nd+ time?
Track consecutive_struggles on the current step across the conversation.

Reply rules:
1. If advanced and on the right track: confirm briefly (e.g. "Good — that's the right idea"), then ask ONE guiding question that leads toward the NEXT step. Never state the next step's result.
2. If wrong or stuck (needs_help, 1-2 struggles): ask a clarifying question that helps THEM find the error — e.g. "Check the given quantities — did you use the initial velocity or the final one?" Never say "that's wrong, the answer is…".
3. If ${escalate ? "struggles have reached 3+ (ESCALATE): offer a more explicit hint or a PARTIAL step (e.g. name the equation to use, or do a partial substitution leaving the arithmetic). Still do NOT give the final number." : "struggles are below 3: keep hints indirect and Socratic."}
4. If the student demands the answer ("just tell me", "I don't get it, explain everything", "скажи ответ"): DO NOT give in. Acknowledge, give the smallest possible nudge, and re-ask a guiding question. ONLY on an explicit "show solution" / "я сдаюсь" reveal the full worked answer, and clearly mark it as such.
5. Keep units in mind; if the student drops units, remind them gently.

Respond with STRICT JSON only, no prose outside the JSON:
{"message": <your spoken reply to the student — no JSON, no spoilers in it>, "step_index": <int>, "advanced": <bool>, "needs_help": <bool>, "finished": <bool>}
Set finished=true only when the student has arrived at the correct final answer themselves (or you are revealing it per rule 4).`

const SOCRATIC_SYMBOLIC = (problem: Problem, escalate: boolean) =>
  SOCRATIC_CORE(problem, escalate) +
  `\n\nNOTE ON FORMULAS: expected steps may be algebraic expressions. Two expressions are equivalent if they simplify to the same form — do NOT require identical strings. If the student writes a mathematically equivalent formula, treat advanced=true even if it looks different. Use the hidden reference to check equivalence, not textual match.`

const SOCRATIC_LADDER = (problem: Problem, escalate: boolean) =>
  SOCRATIC_CORE(problem, escalate) +
  `\n\nESCALATION LADDER per step: (a) neutral guiding question -> (b) point to the relevant given quantity / law -> (c) name the equation to use -> (d) partial substitution, leaving the arithmetic -> (e) ONLY on "show solution" the full step. Never jump (a)->(e) unless the student explicitly asks.`

type SocraticStyle = "numeric" | "symbolic" | "ladder"

export function socraticSystemPrompt(problem: Problem, style: SocraticStyle, escalate: boolean): string {
  if (style === "symbolic") return SOCRATIC_SYMBOLIC(problem, escalate)
  if (style === "ladder") return SOCRATIC_LADDER(problem, escalate)
  return SOCRATIC_CORE(problem, escalate)
}

// ----- Generation -----
function buildProblemPrompt(conceptTitles: string[], chapterText: string, difficulty: Difficulty, prior?: string): string {
  const avoid = prior ? `\nDo NOT repeat this prior problem's numbers or wording; create a fresh variant:\n${prior}\n` : ""
  return [
    "You are authoring a practice problem for a spaced-repetition physics/exact-science tutor.",
    "Create ONE problem based STRICTLY on the concepts and source text below. The problem must be solvable using only the given concepts.",
    "RULES:",
    "- Provide a clear problem_statement with all given quantities and units.",
    "- Provide expected_solution_steps: a numbered reasoning path (the tutor uses it internally; it is NEVER shown to the student).",
    "- Provide final_answer including units where applicable.",
    "- difficulty: " + difficulty,
    "- concept_ids: the concept ids this problem practices (from the list below).",
    avoid,
    "",
    "CONCEPTS AVAILABLE:",
    conceptTitles.join("\n"),
    "",
    "SOURCE TEXT:",
    chapterText.slice(0, 12000),
  ].join("\n")
}

function normalizeProblem(raw: unknown, bookId: string, conceptIds: string[], variant: number): Problem {
  const r = (raw as Record<string, unknown>) ?? {}
  const steps = (r.expected_solution_steps as string[]) ?? []
  return {
    problem_id: `prob-${conceptIds.join("-")}-${variant}`,
    book_id: bookId,
    concept_ids: (r.concept_ids as string[]) ?? conceptIds,
    problem_statement: (r.problem_statement as string) ?? "",
    expected_solution_steps: steps,
    final_answer: (r.final_answer as string) ?? "",
    difficulty: (r.difficulty as Difficulty) ?? "easy",
    variant,
  }
}

export async function generateProblem(
  bookId: string,
  conceptIds: string[],
  conceptTitles: string[],
  chapterText: string,
  opts: { difficulty?: Difficulty; reviewCount?: number; priorStatement?: string; signal?: AbortSignal } = {}
): Promise<Problem> {
  const difficulty = opts.difficulty ?? "easy"
  const existing = await loadProblemCache(bookId, conceptIds[0])
  const regenerate =
    !existing ||
    (!!opts.reviewCount && opts.reviewCount > 0 && variantDecision(opts.reviewCount))
  if (existing && !regenerate) return existing
  const prompt = buildProblemPrompt(conceptTitles, chapterText, difficulty, opts.priorStatement)
  const res = await callZen(prompt, { schema: PROBLEM_SCHEMA, temperature: 0.8, maxTokens: 1500, signal: opts.signal })
  const data = (res.parsed as Record<string, unknown> | undefined) ?? undefined
  const problem = normalizeProblem(data ?? {}, bookId, conceptIds, (existing?.variant ?? 0) + 1)
  await saveProblemCache(problem)
  return problem
}

// Mirrors exercises.shouldRegenerateVariant (kept local to avoid a circular dep).
function variantDecision(reviewCount: number): boolean {
  if (reviewCount > 0 && reviewCount % VARIANT_PERIOD === 0) return true
  return Math.random() < VARIANT_PROB
}

// ----- Cache -----
export async function loadProblemCache(bookId: string, conceptId: string): Promise<Problem | undefined> {
  return idbGet<Problem>(STORES.problemCache, [bookId, conceptId])
}
export async function saveProblemCache(problem: Problem): Promise<void> {
  await idbPut(STORES.problemCache, problem)
}

// ----- Tutor turn -----
interface TutorContext {
  style?: SocraticStyle
  struggles?: number // consecutive struggles on the current step
  signal?: AbortSignal
}

export async function tutorReply(
  problem: Problem,
  turns: TutorTurn[],
  studentText: string,
  ctx: TutorContext = {}
): Promise<TutorReply> {
  const escalate = (ctx.struggles ?? 0) >= 3
  const system: ZenMessage = {
    role: "system",
    content: socraticSystemPrompt(problem, ctx.style ?? "numeric", escalate),
  }
  const history: ZenMessage[] = turns
    .filter((t) => t.role !== "system")
    .map((t) => ({ role: (t.role === "tutor" ? "assistant" : "user") as "user" | "assistant", content: t.content }))
  const messages: ZenMessage[] = [
    system,
    ...history,
    { role: "user", content: studentText },
  ]
  const res = await callZen("", { schema: TUTOR_REPLY_SCHEMA, messages, temperature: 0.4, maxTokens: 700, signal: ctx.signal })
  const data = (res.parsed as Partial<TutorReply> | undefined) ?? undefined
  if (data && typeof data.message === "string") {
    return {
      message: data.message,
      step_index: typeof data.step_index === "number" ? data.step_index : 0,
      advanced: !!data.advanced,
      needs_help: !!data.needs_help,
      finished: !!data.finished,
    }
  }
  // Fallback: treat the raw content as a tutor message.
  return { message: res.content || "(no response)", step_index: 0, advanced: false, needs_help: false, finished: false }
}

// ----- Final-answer local check (mathjs safety net) -----
// Compares the student's final answer to the problem's final_answer allowing a
// small relative tolerance and checking units. For symbolic answers, uses
// mathjs simplify/equal. Returns a confidence signal, not a hard verdict.
import { create, all, type MathJsInstance } from "mathjs"

let _math: MathJsInstance | null = null
function math(): MathJsInstance {
  if (!_math) _math = create(all) as unknown as MathJsInstance
  return _math
}

const REL_TOL = 0.02

function extractNumber(text: string): number | null {
  // Find the first standalone number (with optional decimal / scientific / sign).
  const m = text.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/)
  return m ? parseFloat(m[0]) : null
}

function extractUnit(text: string): string | null {
  const units = ["m", "s", "kg", "N", "J", "W", "Pa", "m/s", "m/s^2", "kg/m", "rad", "Hz", "C", "V", "A", "Ω", "L", "mol"]
  for (const u of units) {
    const re = new RegExp(`\\b${u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
    if (re.test(text)) return u
  }
  return null
}

interface FinalAnswerCheck {
  numericMatch: boolean | null // null = no number to compare
  unitMatch: boolean | null // null = no unit in expected
  symbolicEquivalent: boolean | null // null = not symbolic / unparseable
  confident: boolean
}

export function checkFinalAnswer(problem: Problem, studentText: string): FinalAnswerCheck {
  const expected = problem.final_answer
  const expNum = extractNumber(expected)
  const stuNum = extractNumber(studentText)
  let numericMatch: boolean | null = null
  if (expNum !== null && stuNum !== null && expNum !== 0) {
    numericMatch = Math.abs(stuNum - expNum) <= REL_TOL * Math.abs(expNum)
  }

  const expUnit = extractUnit(expected)
  const stuUnit = extractUnit(studentText)
  let unitMatch: boolean | null = null
  if (expUnit !== null) unitMatch = stuUnit === expUnit

  let symbolicEquivalent: boolean | null = null
  try {
    const e = math().simplify(math().parse(expected))
    const s = math().simplify(math().parse(studentText))
    symbolicEquivalent = e.equals(s)
  } catch {
    symbolicEquivalent = null
  }

  const confident = numericMatch === true || symbolicEquivalent === true
  return { numericMatch, unitMatch, symbolicEquivalent, confident }
}

// ----- SM-2 linkage -----
// Maps a solve outcome to an SM-2 quality score. Independent = strongest signal.
export function qualityFromSolve(result: SolveResult): number {
  switch (result) {
    case "independent":
      return 5
    case "hinted":
      return 3
    case "shown":
      return 1
  }
}
