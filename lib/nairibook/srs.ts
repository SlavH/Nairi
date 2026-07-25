// Client-side spaced repetition (SM-2) + lesson scheduling for NairiBook.
//
// SM-2 state per concept is stored in IndexedDB (srState store). The scheduler
// respects the concept dependency graph: a concept is only unlocked once all of
// its `depends_on` concepts are completed. Due reviews (next_review_date <= now)
// are prioritized ahead of new material.

import { idbGet, idbPut, STORES } from "./db"
import type { ConceptGraph } from "./types"

export interface SM2State {
  book_id: string
  concept_id: string
  ease_factor: number // starts 2.5, min 1.3
  interval: number // days until next review
  repetitions: number // consecutive successful reviews
  next_review_date: number // epoch ms
  last_review_date: number // epoch ms
  review_count: number // total reviews (for variant regeneration)
  variant: number // current cached exercise variant
}

const DAY_MS = 86_400_000
const INITIAL_EF = 2.5
const MIN_EF = 1.3

// Apply one SM-2 review. quality q in 0..5 (5 = perfect).
export function review(prev: SM2State | undefined, quality: number, id?: { book_id: string; concept_id: string }): SM2State {
  const q = Math.max(0, Math.min(5, Math.round(quality)))
  const base: SM2State = prev ?? {
    book_id: id?.book_id ?? "",
    concept_id: id?.concept_id ?? "",
    ease_factor: INITIAL_EF,
    interval: 0,
    repetitions: 0,
    next_review_date: 0,
    last_review_date: 0,
    review_count: 0,
    variant: 0,
  }

  let { ease_factor, interval, repetitions } = base

  if (q < 3) {
    repetitions = 0
    interval = 1
  } else {
    repetitions += 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.round(interval * ease_factor)
  }

  // Update ease factor.
  ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ease_factor < MIN_EF) ease_factor = MIN_EF

  const now = Date.now()
  return {
    ...base,
    ease_factor,
    interval,
    repetitions,
    last_review_date: now,
    next_review_date: now + interval * DAY_MS,
    review_count: base.review_count + 1,
  }
}

export async function loadSM2(bookId: string, conceptId: string): Promise<SM2State | undefined> {
  return idbGet<SM2State>(STORES.srState, [bookId, conceptId])
}

export async function saveSM2(state: SM2State): Promise<void> {
  await idbPut(STORES.srState, state)
}

// A concept is unlocked if it has no dependencies, or all of its depends_on
// concepts have been completed (present in `completed`).
export function isUnlocked(
  conceptId: string,
  completed: Set<string>,
  graph: ConceptGraph
): boolean {
  const edge = graph.edges.find((e) => e.concept_id === conceptId)
  if (!edge || edge.depends_on.length === 0) return true
  return edge.depends_on.every((d) => completed.has(d))
}

export interface NextConcept {
  concept_id: string
  due: boolean // true = review (overdue/upcoming), false = new material
}

// Decide the next concept to study. Unlocked concepts are considered; among
// those, due reviews (next_review_date <= now) come first (earliest due first),
// then new material following the graph's topological order.
export function getNextConcepts(
  graph: ConceptGraph,
  srStates: Map<string, SM2State>,
  completed: Set<string>,
  now: number = Date.now()
): NextConcept[] {
  const unlocked = graph.topological_order.filter((cid) =>
    isUnlocked(cid, completed, graph)
  )

  const due: { cid: string; due: number }[] = []
  const fresh: string[] = []

  for (const cid of unlocked) {
    const st = srStates.get(cid)
    if (st && st.next_review_date <= now) {
      due.push({ cid, due: st.next_review_date })
    } else {
      fresh.push(cid)
    }
  }

  due.sort((a, b) => a.due - b.due) // earliest due first

  return [
    ...due.map((d) => ({ concept_id: d.cid, due: true })),
    ...fresh.map((cid) => ({ concept_id: cid, due: false })),
  ]
}

// Quality score (0..5) derived from a lesson's correct/total ratio.
export function lessonQuality(correct: number, total: number): number {
  if (total === 0) return 0
  const ratio = correct / total
  // Map ratio to SM-2 quality buckets.
  if (ratio >= 1) return 5
  if (ratio >= 0.8) return 4
  if (ratio >= 0.6) return 3
  if (ratio >= 0.4) return 2
  if (ratio >= 0.2) return 1
  return 0
}

import type { SolveResult } from "./problem"

// A problem solve outcome maps to an SM-2 quality: solving independently is the
// strongest mastery signal, solving with hints is weaker, and having the
// solution shown is the weakest. This feeds the EXISTING scheduler (review()),
// not a parallel mechanism.
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

// Apply a problem-solving result to every concept the problem practiced, updating
// and persisting their SM-2 states. Returns the updated states map.
export async function applySolveResult(
  bookId: string,
  conceptIds: string[],
  result: SolveResult,
  prevStates: Map<string, SM2State>
): Promise<Map<string, SM2State>> {
  const q = qualityFromSolve(result)
  const next = new Map(prevStates)
  for (const cid of conceptIds) {
    const st = review(prevStates.get(cid), q, { book_id: bookId, concept_id: cid })
    next.set(cid, st)
    await saveSM2(st)
  }
  return next
}
