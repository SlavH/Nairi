/**
 * Latency percentiles: track p50/p95/p99 for chat and generate APIs; dashboards and SLOs.
 */

const samples: number[] = []
const MAX_SAMPLES = 1000

export function recordLatency(ms: number, label: string): void {
  samples.push(ms)
  if (samples.length > MAX_SAMPLES) samples.shift()
  if (process.env.NAIRI_LOG_LATENCY === "true") {
    console.log("[latency]", label, "ms", ms)
  }
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const i = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, i)]
}

export function getLatencyPercentiles(): { p50: number; p95: number; p99: number } {
  return {
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    p99: percentile(samples, 99),
  }
}
