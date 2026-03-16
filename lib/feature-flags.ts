/**
 * Feature flags (env-based)
 * Use for gradual rollout or toggling features (e.g. new marketplace, simulations).
 * Optional: replace with a feature-flag service for dynamic toggles.
 */

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  const envKey = FEATURE_FLAGS[flag]
  if (!envKey) return false
  const value = process.env[envKey]
  return value === 'true' || value === '1'
}

const FEATURE_FLAGS = {
  /** Enable simulations (when API exists) */
  simulations: 'NEXT_PUBLIC_FEATURE_SIMULATIONS',
  /** Enable new marketplace UI */
  marketplaceV2: 'NEXT_PUBLIC_FEATURE_MARKETPLACE_V2',
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS
