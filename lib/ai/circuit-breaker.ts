/**
 * Circuit breaker: skip Colab model for a cooldown after failures (used in groq-direct).
 */

const COOLDOWN_MS = 60_000 // 1 minute
const FAILURE_THRESHOLD = 2

const state: Map<string, { failures: number; openUntil: number }> = new Map()

export function isCircuitOpen(modelId: string): boolean {
  const s = state.get(modelId)
  if (!s) return false
  if (Date.now() < s.openUntil) return true
  state.delete(modelId)
  return false
}

export function recordFailure(modelId: string): void {
  const s = state.get(modelId) ?? { failures: 0, openUntil: 0 }
  s.failures += 1
  if (s.failures >= FAILURE_THRESHOLD) {
    s.openUntil = Date.now() + COOLDOWN_MS
    s.failures = 0
  }
  state.set(modelId, s)
}

export function recordSuccess(modelId: string): void {
  state.delete(modelId)
}
