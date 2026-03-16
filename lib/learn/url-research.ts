/**
 * Research a URL: fetch the page and extract readable text for NairiBook sources.
 * Used when user adds a URL so AI can use the website content without manual paste.
 */

const MAX_BODY_LENGTH = 500_000
const FETCH_TIMEOUT_MS = 15_000

function extractTextFromHtml(html: string): string {
  // Remove script and style
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
  // Replace br and block elements with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n")
  text = text.replace(/<\/?(p|div|h[1-6]|li|tr|td|th|article|section)[^>]*>/gi, "\n")
  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, " ")
  // Decode common entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // Collapse whitespace and trim
  text = text.replace(/\s+/g, " ").replace(/\n\s+/g, "\n").trim()
  return text.slice(0, MAX_BODY_LENGTH)
}

export async function fetchUrlAndExtractText(url: string): Promise<{ text: string; title?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    })
    clearTimeout(timeout)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("URL did not return HTML")
    }
    const html = await response.text()
    const text = extractTextFromHtml(html)
    if (!text || text.length < 50) {
      throw new Error("Could not extract enough text from the page")
    }
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim().slice(0, 200) : undefined
    return { text, title }
  } finally {
    clearTimeout(timeout)
  }
}
