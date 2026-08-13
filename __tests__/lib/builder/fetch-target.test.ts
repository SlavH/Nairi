import { describe, it, expect, vi, afterEach } from "vitest"

import { safeFetch, safeFetchText, validateFetchTarget } from "@/lib/builder/utils/fetch-target"

function okResponse(): Response {
  return new Response("hello", { status: 200 })
}

function redirectResponse(location: string): Response {
  return new Response("", { status: 302, headers: { location } })
}

/**
 * Covers the safeFetch layer on top of validateFetchTarget (see
 * __tests__/lib/builder/ssrf-guard.test.ts for the pure validation matrix).
 */
describe("safeFetch - SSRF-safe fetch wrapper", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("rejects non-https targets before any network call happens", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await expect(safeFetch("http://example.com")).rejects.toThrow("Only HTTPS URLs are allowed")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects private targets before any network call happens", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await expect(safeFetch("https://10.0.0.1/")).rejects.toThrow(
      "Private/reserved IP addresses are not allowed"
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fetches with manual redirect handling for a public target", async () => {
    const fetchMock = vi.fn(async () => okResponse())
    vi.stubGlobal("fetch", fetchMock)
    const res = await safeFetch("https://example.com")
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ redirect: "manual" })
    )
  })

  it("aborts instead of following a 3xx redirect to a private host", async () => {
    const fetchMock = vi.fn(async () => redirectResponse("http://169.254.169.254/latest/meta-data/"))
    vi.stubGlobal("fetch", fetchMock)
    await expect(safeFetch("https://example.com")).rejects.toThrow("Redirect to disallowed URL")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("aborts on a 3xx redirect to an http-only host", async () => {
    const fetchMock = vi.fn(async () => redirectResponse("http://public.example.com"))
    vi.stubGlobal("fetch", fetchMock)
    await expect(safeFetch("https://example.com")).rejects.toThrow("Redirect to disallowed URL")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("allows a 3xx redirect to a public https host (re-validated per hop)", async () => {
    const fetchMock = vi.fn(async () => redirectResponse("https://cdn.example.com/file"))
    vi.stubGlobal("fetch", fetchMock)
    const res = await safeFetch("https://example.com")
    expect(res.status).toBe(302)
  })

  it("ignores a 3xx response without a Location header", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 302 })))
    const res = await safeFetch("https://example.com")
    expect(res.status).toBe(302)
  })

  it("safeFetchText returns null for non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })))
    expect(await safeFetchText("https://example.com")).toBeNull()
  })

  it("safeFetchText throws when content-length exceeds the 1MB cap", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("x", { status: 200, headers: { "content-length": "2000000" } }))
    )
    await expect(safeFetchText("https://example.com/big")).rejects.toThrow("Response too large")
  })
})
