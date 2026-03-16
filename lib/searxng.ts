/**
 * SearXNG Space – web search for Nairi chat grounding.
 * GET {SEARXNG_BASE_URL}/search?q=...&format=json&language=en
 * In-memory cache: query -> results, 30 min TTL.
 */

const SEARXNG_BASE = (process.env.SEARXNG_BASE_URL ?? "").trim().replace(/\/+$/, "")
const SEARXNG_SEARCH_PATH = "/search"
const WEB_SEARCH_TIMEOUT_MS = 12_000
const TOP_N = 3
const CACHE_TTL_MS = 30 * 60 * 1000

export interface SearchResult {
  id: number
  title: string
  url: string
  snippet: string
}

interface CacheEntry {
  results: SearchResult[]
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

function pruneCache(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) cache.delete(key)
  }
}

export function isSearxngConfigured(): boolean {
  return SEARXNG_BASE.length > 0
}

/**
 * SearXNG search: top 3 results, timeout 10–12s.
 * Parses title/url/content/snippet robustly. Uses in-memory cache (30 min).
 */
export async function searxngSearch(query: string): Promise<{ results: SearchResult[]; ok: boolean }> {
  if (!SEARXNG_BASE) {
    return { results: [], ok: false }
  }

  const cacheKey = query.trim().toLowerCase().slice(0, 500)
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { results: cached.results, ok: true }
  }

  const url = `${SEARXNG_BASE}${SEARXNG_SEARCH_PATH}?q=${encodeURIComponent(query)}&format=json&language=en`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) return { results: [], ok: false }
    const data = (await res.json()) as { results?: Array<Record<string, unknown>> }
    const raw = Array.isArray(data?.results) ? data.results : []
    const results: SearchResult[] = raw.slice(0, TOP_N).map((item, i) => {
      const title = typeof item.title === "string" ? item.title : (typeof item.url === "string" ? item.url : "")
      const urlVal = typeof item.url === "string" ? item.url : ""
      const snippet = typeof item.content === "string" ? item.content : (typeof item.snippet === "string" ? item.snippet : "")
      return {
        id: i + 1,
        title: title || urlVal,
        url: urlVal,
        snippet: snippet || "",
      }
    })
    if (cache.size > 500) pruneCache()
    cache.set(cacheKey, { results, timestamp: Date.now() })
    return { results, ok: true }
  } catch {
    clearTimeout(timeoutId)
    return { results: [], ok: false }
  }
}
