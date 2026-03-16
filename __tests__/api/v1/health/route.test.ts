import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/v1/health/route"

describe("GET /api/v1/health", () => {
  it("returns 200 with v1 healthy status and checks", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe("healthy")
    expect(data.version).toBe("v1")
    expect(data.message).toBeDefined()
    expect(data.checks).toBeDefined()
    expect(data.checks.server).toBe("ok")
  })
})
