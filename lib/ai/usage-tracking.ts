/**
 * Cost and token tracking: per-request token counts and estimated cost by provider.
 * Persist in usage_logs and expose in dashboard.
 */

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
  provider: string
  estimatedCostUsd?: number
}

const COST_PER_1K = {
  "llama-3.3-70b-versatile": 0.0002,
  "llama-3.1-70b-versatile": 0.0002,
  "llama-3.1-8b-instant": 0.00005,
  "gemma2-9b-it": 0.00005,
} as Record<string, number>

export function estimateCost(usage: TokenUsage): number {
  const rate = COST_PER_1K[usage.model] ?? 0.0001
  return ((usage.promptTokens + usage.completionTokens) / 1000) * rate
}

export function recordUsage(usage: TokenUsage): void {
  const cost = estimateCost(usage)
  const withCost = { ...usage, estimatedCostUsd: cost }
  if (process.env.NAIRI_LOG_USAGE !== "false") {
    console.log("[usage]", JSON.stringify(withCost))
  }
}
