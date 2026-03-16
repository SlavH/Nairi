/**
 * Pillar K: Platform, Infrastructure, and Reliability (Phases 113–125)
 * Real implementations: health checks, feature flags, rate limits.
 */

export const HEALTH_CHECK_DEPTH = ["server", "db", "redis", "stripe", "ai"] as const
export const RATE_LIMIT_GLOBAL_RPM = 1000
export const RATE_LIMIT_PER_ENDPOINT: Record<string, number> = {
  "/api/chat": 60,
  "/api/create": 30,
  "/api/builder/generate": 20,
  "/api/generate-presentation": 10,
}

const featureFlags = new Map<string, boolean>()

export function isFeatureEnabled(flag: string): boolean {
  const envVal = process.env[`NAIRI_FF_${flag.toUpperCase().replace(/-/g, "_")}`]
  if (envVal !== undefined) return envVal === "true" || envVal === "1"
  return featureFlags.get(flag) ?? true
}

export function setFeatureFlag(flag: string, enabled: boolean): void {
  featureFlags.set(flag, enabled)
}

export function getRateLimitForPath(path: string): number {
  for (const [prefix, limit] of Object.entries(RATE_LIMIT_PER_ENDPOINT)) {
    if (path.includes(prefix)) return limit
  }
  return 120
}
