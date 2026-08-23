import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/ai/groq-direct", () => ({
  generateWithFallback: vi.fn(),
}))

const { generateWithFallback } = await import("@/lib/ai/groq-direct")
const { ModelComparison } = await import("@/lib/chat/model-comparison")

describe("ModelComparison.compareModels (F14)", () => {
  beforeEach(() => {
    vi.mocked(generateWithFallback).mockReset()
  })

  it("passes each requested model through to the backend", async () => {
    vi.mocked(generateWithFallback).mockImplementation(async (opts: any) => ({
      text: `reply for ${opts.model}`,
      model: opts.model,
    }))

    const results = await ModelComparison.compareModels("Hi", [
      { provider: "nairi", model: "model-a" },
      { provider: "groq", model: "model-b" },
    ])

    expect(results).toHaveLength(2)
    const requestedModels = vi.mocked(generateWithFallback).mock.calls.map(
      (c: any[]) => c[0].model
    )
    expect(requestedModels).toEqual(["model-a", "model-b"])
    expect(results[0].response).toBe("reply for model-a")
    expect(results[1].response).toBe("reply for model-b")
  })

  it("reports the model that actually served when fallback renames it", async () => {
    vi.mocked(generateWithFallback)
      .mockResolvedValueOnce({ text: "ok", model: "llama-3.3-70b" })
      .mockRejectedValueOnce(new Error("boom"))

    const results = await ModelComparison.compareModels("Hi", [
      { provider: "nairi", model: "requested-a" },
      { provider: "nairi", model: "requested-b" },
    ])

    expect(results[0].model).toBe("llama-3.3-70b")
    expect(results[1].response).toContain("Error:")
  })
})
