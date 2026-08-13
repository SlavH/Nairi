import { describe, it, expect, vi, afterEach } from "vitest"
import { NextRequest } from "next/server"

import {
  validateOrigin,
  assertSameOrigin,
  validateContentType,
  validateRequestSize,
  sanitizeString,
  detectSuspiciousPatterns,
} from "@/lib/security/request-validator"

const ALLOWED = ["https://example.com"]

describe("validateOrigin - exact origin matching", () => {
  it("allows an exact same-origin request", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://example.com" },
    })
    expect(validateOrigin(req, ALLOWED)).toEqual({ valid: true })
  })

  it("allows the same origin with an explicit default port (443)", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://example.com:443" },
    })
    expect(validateOrigin(req, ALLOWED)).toEqual({ valid: true })
  })

  it("allows a case-variant hostname (URL hostnames normalize to lowercase)", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://EXAMPLE.com" },
    })
    expect(validateOrigin(req, ALLOWED)).toEqual({ valid: true })
  })

  it("allows requests with no origin or referer header (non-browser clients)", () => {
    const req = new NextRequest("https://example.com/chat")
    expect(validateOrigin(req, ALLOWED)).toEqual({ valid: true })
  })

  it("uses the referer origin as a fallback when no origin header is present", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { referer: "https://example.com/some/path" },
    })
    expect(validateOrigin(req, ALLOWED)).toEqual({ valid: true })
  })

  it("rejects a lookalike prefix domain (https://evil-example.com)", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://evil-example.com" },
    })
    expect(validateOrigin(req, ALLOWED)).toEqual({
      valid: false,
      error: "Origin https://evil-example.com not allowed",
    })
  })

  it("rejects a suffix-matching domain (https://notexample.com)", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://notexample.com" },
    })
    expect(validateOrigin(req, ALLOWED).valid).toBe(false)
  })

  it("rejects the old substring-includes bypass (https://example.com.evil.org)", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://example.com.evil.org" },
    })
    expect(validateOrigin(req, ALLOWED).valid).toBe(false)
  })

  it("rejects a subdomain (https://app.example.com) because hostname must match exactly", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://app.example.com" },
    })
    expect(validateOrigin(req, ALLOWED).valid).toBe(false)
  })

  it("rejects a mismatched port", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://example.com:8443" },
    })
    expect(validateOrigin(req, ALLOWED).valid).toBe(false)
  })

  it("rejects a downgraded protocol (http vs https)", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "http://example.com" },
    })
    expect(validateOrigin(req, ALLOWED).valid).toBe(false)
  })

  it("normalizes default port 80 for http origins", () => {
    const req = new NextRequest("http://example.com/chat", {
      headers: { origin: "http://example.com:80" },
    })
    expect(validateOrigin(req, ["http://example.com"])).toEqual({ valid: true })
  })

  it("rejects an origin that does not parse as a URL", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "not-a-valid-url" },
    })
    expect(validateOrigin(req, ALLOWED).valid).toBe(false)
  })

  it("rejects a malicious referer fallback", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { referer: "https://evil.com/phish" },
    })
    expect(validateOrigin(req, ALLOWED).valid).toBe(false)
  })

  it("rejects everything when the allowlist entry is not a parseable URL", () => {
    const req = new NextRequest("https://example.com/chat", {
      headers: { origin: "https://example.com" },
    })
    expect(validateOrigin(req, ["not-a-url"]).valid).toBe(false)
  })
})

describe("assertSameOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns null (allowed) for an origin on the ALLOWED_ORIGINS allowlist", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://example.com")
    const req = new NextRequest("https://example.com/x", {
      headers: { origin: "https://example.com" },
    })
    expect(assertSameOrigin(req)).toBeNull()
  })

  it("returns a 403 Response for a cross-origin request", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://example.com")
    const req = new NextRequest("https://example.com/x", {
      headers: { origin: "https://evil-example.com" },
    })
    const res = assertSameOrigin(req)
    expect(res).not.toBeNull()
    expect(res!.status).toBe(403)
    expect(res!.headers.get("content-type")).toContain("application/json")
  })

  it("returns 403 for the substring-bypass origin end-to-end through assertSameOrigin", async () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://example.com")
    const req = new NextRequest("https://example.com/x", {
      headers: { origin: "https://example.com.evil.org" },
    })
    const res = assertSameOrigin(req)
    expect(res!.status).toBe(403)
    const body = await res!.json()
    expect(body.error).toBe("Cross-origin request blocked")
  })

  it("allows requests without an origin header", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://example.com")
    const req = new NextRequest("https://example.com/x")
    expect(assertSameOrigin(req)).toBeNull()
  })

  it("always allows localhost development origins", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "")
    const req = new NextRequest("http://localhost:3000/x", {
      headers: { origin: "http://localhost:3000" },
    })
    expect(assertSameOrigin(req)).toBeNull()
  })

  it("includes the Supabase project origin in the allowlist", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc123.supabase.co")
    const req = new NextRequest("https://abc123.supabase.co/x", {
      headers: { origin: "https://abc123.supabase.co" },
    })
    expect(assertSameOrigin(req)).toBeNull()
  })
})

describe("request validation helpers (regression sanity)", () => {
  it("validateContentType is case-insensitive and rejects disallowed types", () => {
    const json = new NextRequest("http://localhost/chat", {
      method: "POST",
      headers: { "content-type": "Application/JSON; charset=utf-8" },
    })
    expect(validateContentType(json, ["application/json"])).toEqual({ valid: true })

    const xml = new NextRequest("http://localhost/chat", {
      method: "POST",
      headers: { "content-type": "text/xml" },
    })
    expect(validateContentType(xml, ["application/json"]).valid).toBe(false)
  })

  it("validateRequestSize rejects bodies over the limit", async () => {
    const small = new NextRequest("http://localhost/chat", {
      method: "POST",
      headers: { "content-length": "100" },
    })
    expect(await validateRequestSize(small, 1024)).toEqual({ valid: true })

    const large = new NextRequest("http://localhost/chat", {
      method: "POST",
      headers: { "content-length": "2048" },
    })
    const result = await validateRequestSize(large, 1024)
    expect(result.valid).toBe(false)
  })

  it("sanitizeString strips null bytes, control chars and whitespace", () => {
    expect(sanitizeString("  a\u0000b\u0001c  ")).toBe("abc")
  })

  it("detectSuspiciousPatterns flags SQL injection and XSS", () => {
    expect(detectSuspiciousPatterns("SELECT * FROM users UNION SELECT 1").suspicious).toBe(true)
    expect(detectSuspiciousPatterns("<script>alert(1)</script>").suspicious).toBe(true)
    expect(detectSuspiciousPatterns("hello world").suspicious).toBe(false)
  })
})
