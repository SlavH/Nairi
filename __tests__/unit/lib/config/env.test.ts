import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const REQUIRED = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
}

/**
 * env.ts validates required vars and evaluates `config` at import time, so
 * every case needs a fresh module graph with the env stubbed before import.
 */
describe("lib/config/env - Stripe is optional", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("imports without throwing when Stripe vars are absent and exposes empty Stripe keys", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", REQUIRED.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", REQUIRED.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", REQUIRED.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv("STRIPE_SECRET_KEY", "")
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "")

    const { config } = await import("@/lib/config/env")
    expect(config.supabase.url).toBe(REQUIRED.NEXT_PUBLIC_SUPABASE_URL)
    expect(config.stripe.secretKey).toBe("")
    expect(config.stripe.publishableKey).toBe("")
    expect(config.stripe.webhookSecret).toBeUndefined()
  })

  it("propagates all values when every var is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", REQUIRED.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", REQUIRED.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", REQUIRED.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc123")
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_live_xyz789")
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123")
    vi.stubEnv("NAIRI_AI_BASE_URL", "https://ai.example.com")
    vi.stubEnv("BYPASS_AUTH", "true")

    const { config } = await import("@/lib/config/env")
    expect(config.supabase.url).toBe(REQUIRED.NEXT_PUBLIC_SUPABASE_URL)
    expect(config.supabase.anonKey).toBe(REQUIRED.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    expect(config.supabase.serviceRoleKey).toBe(REQUIRED.SUPABASE_SERVICE_ROLE_KEY)
    expect(config.stripe.secretKey).toBe("sk_live_abc123")
    expect(config.stripe.publishableKey).toBe("pk_live_xyz789")
    expect(config.stripe.webhookSecret).toBe("whsec_123")
    expect(config.ai.nairiAiBaseUrl).toBe("https://ai.example.com")
    expect(config.features.bypassAuth).toBe(true)
  })

  it("still throws when a required non-Stripe var is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", REQUIRED.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", REQUIRED.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
    vi.stubEnv("STRIPE_SECRET_KEY", "")

    await expect(import("@/lib/config/env")).rejects.toThrow(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"
    )
  })

  it("throws when the Supabase URL is absent even with Stripe configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", REQUIRED.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", REQUIRED.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc123")

    await expect(import("@/lib/config/env")).rejects.toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    )
  })
})
