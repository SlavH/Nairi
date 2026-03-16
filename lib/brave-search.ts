/**
 * Brave Search API – web search for Nairi chat grounding.
 * Uses BRAVE_API_KEY. If missing, search is skipped (WEB_CONTEXT unavailable).
 */

const BRAVE_API_KEY = process.env.BRAVE_API_KEY?.trim() ?? ""
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"
const WEB_SEARCH_TIMEOUT_MS = 12_000
const TOP_N = 3

export interface SearchResult {
  id: number
  title: string
  url: string
  snippet?: string
}

export async function braveSearch(query: string): Promise<{ results: SearchResult[]; ok: boolean }> {
  if (!BRAVE_API_KEY) {
    return { results: [], ok: false }
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS)
  try {
    const params = new URLSearchParams({ q: query, count: String(TOP_N) })
    const res = await fetch(`${BRAVE_SEARCH_URL}?${params}`, {
      method: "GET",
      headers: { "X-Subscription-Token": BRAVE_API_KEY, Accept: "application/json" },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return { results: [], ok: false }
    const data = (await res.json()) as {
      web?: { results?: Array<{ title?: string; url?: string; description?: string }> }
    }
    const raw = data?.web?.results ?? []
    const results: SearchResult[] = raw.slice(0, TOP_N).map((r, i) => ({
      id: i + 1,
      title: typeof r.title === "string" ? r.title : "",
      url: typeof r.url === "string" ? r.url : "",
      snippet: typeof r.description === "string" ? r.description : undefined,
    }))
    return { results, ok: true }
  } catch {
    clearTimeout(timeoutId)
    return { results: [], ok: false }
  }
}

export function hasBraveSearch(): boolean {
  return BRAVE_API_KEY.length > 0
}
