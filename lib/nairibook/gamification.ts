// Client-side gamification for NairiBook lessons: XP, daily streak, and lives.
// All state is persisted per book in IndexedDB (gamification store). No server,
// no sync — purely local progress.

import { idbGet, idbPut, STORES } from "./db"

export interface GamificationState {
  book_id: string
  xp: number
  daily_streak: number
  last_active_date: string // YYYY-MM-DD of the last day with activity
  lives: number
  lives_last_refill: number // epoch ms of the last life refill tick
  completed: string[] // concept_ids fully mastered, persisted across tab rebuilds
}

export const MAX_LIVES = 5
export const LIFE_REFILL_MS = 30 * 60 * 1000 // +1 life every 30 minutes
const XP_NEW_CONCEPT = 20
const XP_REVIEW = 5

function todayStr(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime()
  const db = new Date(b + "T00:00:00Z").getTime()
  return Math.round((db - da) / 86_400_000)
}

export async function loadGamification(bookId: string): Promise<GamificationState> {
  const existing = await idbGet<GamificationState>(STORES.gamification, bookId)
  return (
    existing ?? {
      book_id: bookId,
      xp: 0,
      daily_streak: 0,
      last_active_date: "",
      lives: MAX_LIVES,
      lives_last_refill: Date.now(),
      completed: [],
    }
  )
}

export async function saveGamification(state: GamificationState): Promise<void> {
  await idbPut(STORES.gamification, state)
}

// Refill lives based on elapsed time since the last refill tick. Returns a new
// (immutable) state with lives capped at MAX_LIVES.
export function refillLives(state: GamificationState, now: number = Date.now()): GamificationState {
  if (state.lives >= MAX_LIVES) {
    return { ...state, lives_last_refill: now }
  }
  const elapsed = now - state.lives_last_refill
  const gained = Math.floor(elapsed / LIFE_REFILL_MS)
  if (gained <= 0) return state
  const lives = Math.min(MAX_LIVES, state.lives + gained)
  // Carry the remainder so refills stay on a steady cadence.
  const remainder = elapsed - gained * LIFE_REFILL_MS
  return { ...state, lives, lives_last_refill: now - remainder }
}

export function loseLife(state: GamificationState): GamificationState {
  return { ...state, lives: Math.max(0, state.lives - 1) }
}

// Award XP. `isNew` distinguishes a first pass (more XP) from a routine review.
export function addXP(state: GamificationState, isNew: boolean): GamificationState {
  return { ...state, xp: state.xp + (isNew ? XP_NEW_CONCEPT : XP_REVIEW) }
}

// Record activity for today, updating the daily streak. Consecutive days
// increment the streak; a missed day resets it to 1.
export function recordActiveDay(state: GamificationState, now: number = Date.now()): GamificationState {
  const today = todayStr(now)
  if (state.last_active_date === today) return state
  let streak = 1
  if (state.last_active_date) {
    const diff = dayDiff(state.last_active_date, today)
    streak = diff === 1 ? state.daily_streak + 1 : 1
  }
  return { ...state, daily_streak: streak, last_active_date: today }
}

// True if the streak is at risk of breaking today (no activity yet today, and a
// streak is active from yesterday). UI uses this to nudge the learner.
export function streakAtRisk(state: GamificationState, now: number = Date.now()): boolean {
  if (!state.last_active_date) return false
  return state.last_active_date !== todayStr(now)
}
