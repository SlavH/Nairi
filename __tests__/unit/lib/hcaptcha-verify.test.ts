import { describe, it, expect, vi, afterEach } from "vitest"

import { verifyHCaptcha } from "@/lib/hcaptcha-verify"

describe("verifyHCaptcha - fail-closed behavior", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("fails closed (success:false) in production when no secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("HCAPTCHA_SECRET_KEY", "")
    const result = await verifyHCaptcha("some-token")
    expect(result.success).toBe(false)
    expect(result.error).toBe("Captcha not configured")
  })

  it("fails closed in the test environment when no secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "test")
    vi.stubEnv("HCAPTCHA_SECRET_KEY", "")
    const result = await verifyHCaptcha("some-token")
    expect(result.success).toBe(false)
    expect(result.error).toBe("Captcha not configured")
  })

  it("returns success in development when no secret is configured (test mode)", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("HCAPTCHA_SECRET_KEY", "")
    const result = await verifyHCaptcha("some-token")
    expect(result.success).toBe(true)
  })

  it("forwards to the hcaptcha siteverify API and returns success for a valid token", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("HCAPTCHA_SECRET_KEY", "0x-test-secret")
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await verifyHCaptcha("valid-token")
    expect(result.success).toBe(true)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://hcaptcha.com/siteverify")
    expect(init.method).toBe("POST")
    const body = String(init.body)
    expect(body).toContain("secret=0x-test-secret")
    expect(body).toContain("response=valid-token")
  })

  it("returns success:false for an invalid or expired token", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("HCAPTCHA_SECRET_KEY", "0x-test-secret")
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            success: false,
            "error-codes": ["invalid-or-already-seen"],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    )
    const result = await verifyHCaptcha("expired-token")
    expect(result.success).toBe(false)
    expect(result.error).toBe("invalid-or-already-seen")
  })

  it("returns success:false for an empty token", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("HCAPTCHA_SECRET_KEY", "0x-test-secret")
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ success: false, "error-codes": ["invalid-response"] }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    )
    const result = await verifyHCaptcha("")
    expect(result.success).toBe(false)
    expect(result.error).toBe("invalid-response")
  })

  it("fails closed when the hcaptcha API request throws", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("HCAPTCHA_SECRET_KEY", "0x-test-secret")
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down")
    }))
    const result = await verifyHCaptcha("some-token")
    expect(result.success).toBe(false)
    expect(result.error).toBe("Captcha verification failed")
  })
})
