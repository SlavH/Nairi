import { describe, it, expect, vi, afterEach } from "vitest"

import { fetchUrlAndExtractText } from "@/lib/learn/url-research"

function htmlResponse(html: string, contentType = "text/html"): Response {
  return new Response(html, { status: 200, headers: { "content-type": contentType } })
}

function redirectResponse(location: string, from = "https://example.com"): Response {
  const res = new Response("", { status: 302, headers: { location } })
  Object.defineProperty(res, "url", { value: from })
  return res
}

const LONG_HTML =
  "<html><head><title>Sample Page Title</title></head><body>" +
  "<h1>Hello</h1>" +
  "<p>This is a sufficiently long paragraph of readable content so that the extractor " +
  "can pull out more than fifty characters of plain text from the page for the " +
  "NairiBook research source without any difficulty whatsoever.</p>" +
  "</body></html>"

describe("fetchUrlAndExtractText - SSRF hardening", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("rejects http:// URLs (https-only)", async () => {
    await expect(fetchUrlAndExtractText("http://example.com")).rejects.toThrow(
      "Only HTTPS URLs are allowed"
    )
  })

  it("rejects loopback https hosts", async () => {
    await expect(fetchUrlAndExtractText("https://127.0.0.1/x")).rejects.toThrow()
  })

  it("rejects RFC1918 private https hosts", async () => {
    await expect(fetchUrlAndExtractText("https://10.0.0.1/x")).rejects.toThrow()
    await expect(fetchUrlAndExtractText("https://172.16.0.1/x")).rejects.toThrow()
    await expect(fetchUrlAndExtractText("https://172.31.255.255/x")).rejects.toThrow()
    await expect(fetchUrlAndExtractText("https://192.168.1.1/x")).rejects.toThrow()
  })

  it("rejects the cloud metadata endpoint over https", async () => {
    await expect(fetchUrlAndExtractText("https://169.254.169.254/latest/meta-data/")).rejects.toThrow()
  })

  it("rejects IPv6 loopback and link-local hosts", async () => {
    await expect(fetchUrlAndExtractText("https://[::1]/")).rejects.toThrow()
    await expect(fetchUrlAndExtractText("https://[fe80::1]/")).rejects.toThrow()
  })

  it("fetches a public https page and extracts text plus title", async () => {
    const fetchMock = vi.fn(async () => htmlResponse(LONG_HTML))
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchUrlAndExtractText("https://public.example.com/article")
    expect(result.title).toBe("Sample Page Title")
    expect(result.text.length).toBeGreaterThan(50)
    expect(result.text).not.toContain("<script")
    expect(result.text).not.toContain("<p>")
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.example.com/article",
      expect.objectContaining({
        redirect: "manual",
        headers: expect.objectContaining({
          "User-Agent": expect.stringContaining("Mozilla/5.0"),
        }),
      })
    )
  })

  it("does NOT follow a redirect to a private host (fetch to metadata URL never happens)", async () => {
    const fetchMock = vi.fn(async (_url: string) =>
      redirectResponse("http://169.254.169.254/latest/meta-data/iam/security-credentials/")
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchUrlAndExtractText("https://public.example.com")).rejects.toThrow(
      "Redirect to disallowed URL"
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe("https://public.example.com")
  })

  it("does NOT follow a redirect to a loopback host over https", async () => {
    const fetchMock = vi.fn(async () => redirectResponse("https://127.0.0.1/admin"))
    vi.stubGlobal("fetch", fetchMock)
    await expect(fetchUrlAndExtractText("https://public.example.com")).rejects.toThrow(
      "Redirect to disallowed URL"
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("re-validates every redirect hop and follows a public redirect chain", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://a.example.com") {
        return redirectResponse("https://b.example.com", "https://a.example.com")
      }
      return htmlResponse(LONG_HTML)
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchUrlAndExtractText("https://a.example.com")
    expect(result.text.length).toBeGreaterThan(50)
    expect(fetchMock).toHaveBeenCalledWith("https://b.example.com/", expect.any(Object))
  })

  it("gives up after the maximum number of redirect hops", async () => {
    let hops = 0
    const fetchMock = vi.fn(async () => {
      hops += 1
      return redirectResponse("https://loop.example.com/next", `https://loop.example.com/${hops}`)
    })
    vi.stubGlobal("fetch", fetchMock)

    // Initial request + 5 followed hops = 6 fetches, then the loop stops on a 3xx.
    await expect(fetchUrlAndExtractText("https://loop.example.com/start")).rejects.toThrow(
      "HTTP 302"
    )
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it("throws when a redirect lacks a Location header", async () => {
    const res = new Response("", { status: 301 })
    Object.defineProperty(res, "url", { value: "https://example.com" })
    vi.stubGlobal("fetch", vi.fn(async () => res))

    await expect(fetchUrlAndExtractText("https://example.com")).rejects.toThrow(
      "Redirect without Location header"
    )
  })

  it("throws when the response is not HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{\"a\":1}", { status: 200, headers: { "content-type": "application/json" } }))
    )
    await expect(fetchUrlAndExtractText("https://example.com/data.json")).rejects.toThrow(
      "URL did not return HTML"
    )
  })

  it("throws when the page contains too little extractable text", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => htmlResponse("<html><body><p>short</p></body></html>")))
    await expect(fetchUrlAndExtractText("https://example.com/blank")).rejects.toThrow(
      "Could not extract enough text from the page"
    )
  })

  it("throws on an HTTP error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Not found", { status: 404, headers: { "content-type": "text/html" } }))
    )
    await expect(fetchUrlAndExtractText("https://example.com/missing")).rejects.toThrow("HTTP 404")
  })
})
