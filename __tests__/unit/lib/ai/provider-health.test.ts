import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

const { createClient } = await import("@/lib/supabase/server")
const { ProviderHealthMonitor } = await import("@/lib/ai/provider-health")

function mockLogs(logs: Array<{ success: boolean | null }>, error: unknown = null) {
  vi.mocked(createClient).mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => Promise.resolve({ data: logs, error }),
        }),
      }),
    }),
  } as any)
}

// The monitor caches per provider for 60s; use distinct provider names per test.
describe("ProviderHealthMonitor.checkHealth (F26)", () => {
  beforeEach(() => {
    ;(ProviderHealthMonitor as any).healthCache = new Map()
  })

  it("reports healthy when failures are rare", async () => {
    mockLogs([
      { success: true }, { success: true }, { success: true },
      { success: true }, { success: true }, { success: false },
    ])
    const health = await ProviderHealthMonitor.checkHealth("p-healthy")
    expect(health.status).toBe("healthy")
  })

  it("reports degraded when error rate exceeds 20%", async () => {
    mockLogs([
      { success: true }, { success: true }, { success: true },
      { success: false }, { success: false },
    ])
    const health = await ProviderHealthMonitor.checkHealth("p-degraded")
    expect(health.status).toBe("degraded")
  })

  it("reports down when error rate exceeds 50%", async () => {
    mockLogs([{ success: false }, { success: false }, { success: true }, { success: false }])
    const health = await ProviderHealthMonitor.checkHealth("p-down")
    expect(health.status).toBe("down")
  })

  it("skips NULL (unknown) rows instead of counting them as failures", async () => {
    mockLogs([{ success: null }, { success: null }, { success: true }])
    const health = await ProviderHealthMonitor.checkHealth("p-unknown")
    expect(health.status).toBe("healthy")
    expect(health.errorRate).toBe(0)
  })

  it("does not report down merely because the query errored silently before (F26 regression)", async () => {
    // A query error must surface through the catch path with an explicit
    // errorRate of 100 only after a real failure — previously the missing
    // columns made EVERY check land here.
    mockLogs([], { message: "column does not exist" })
    const health = await ProviderHealthMonitor.checkHealth("p-error")
    expect(health.status).toBe("down")
  })

  it("returns default healthy status when no recent logs exist", async () => {
    mockLogs([])
    const health = await ProviderHealthMonitor.checkHealth("p-empty")
    expect(health.status).toBe("healthy")
    expect(health.errorRate).toBe(0)
  })
})
