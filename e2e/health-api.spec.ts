import { test, expect } from "@playwright/test"

test.describe("Health API", () => {
  test("GET /api/health returns 200 and healthy status", async ({ request }) => {
    const res = await request.get("/api/health")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.status).toBe("healthy")
    expect(data.checks?.server).toBe("ok")
  })

  test("GET /api/v1/health returns 200 and v1 message", async ({ request }) => {
    const res = await request.get("/api/v1/health")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.status).toBe("healthy")
    expect(data.version).toBe("v1")
  })
})
