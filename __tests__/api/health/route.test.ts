import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: () => ({ select: () => ({ limit: () => Promise.resolve({ error: null }) }) }),
    })
  ),
}))

vi.mock("@/lib/config/env", () => ({
  config: {
    env: "test",
    ai: { bitnetBaseUrl: "http://localhost:8000/v1" },
    supabase: { url: "https://test.supabase.co", anonKey: "test-key" },
  },
}))

import { GET, HEAD } from "@/app/api/health/route"

describe("GET /api/health", () => {
  it("returns 200 with healthy status and checks", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe("healthy")
    expect(data.timestamp).toBeDefined()
    expect(data.checks).toBeDefined()
    expect(data.checks.server).toBeDefined()
    expect(data.checks.server.status).toBe("ok")
    expect(data.checks.supabase).toBeDefined()
    expect(["ok", "degraded", "down"]).toContain(data.checks.supabase.status)
    expect(data.checks.ai_providers).toBeDefined()
    expect(["ok", "degraded", "down"]).toContain(data.checks.ai_providers.status)
  })
})

describe("HEAD /api/health", () => {
  it("returns 200 for readiness", async () => {
    const res = await HEAD()
    expect(res.status).toBe(200)
  })
})
