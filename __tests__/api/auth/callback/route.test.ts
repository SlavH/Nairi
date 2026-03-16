import { describe, it, expect } from "vitest"
import { GET } from "@/app/auth/callback/route"

describe("GET /auth/callback", () => {
  it("redirects to /auth/login when no code provided", async () => {
    const req = new Request("http://localhost/auth/callback")
    const res = await GET(req)
    expect([302, 307]).toContain(res.status)
    expect(res.headers.get("location")).toContain("/auth/login")
  })

  it("redirects to /auth/error when error param present", async () => {
    const req = new Request("http://localhost/auth/callback?error=access_denied&error_description=User+cancelled")
    const res = await GET(req)
    expect([302, 307]).toContain(res.status)
    expect(res.headers.get("location")).toContain("/auth/error")
    expect(res.headers.get("location")).toContain("error=")
  })
})
