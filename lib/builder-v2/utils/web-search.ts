/**
 * Web Search Utilities for Builder V2
 * Provides internet access for design research
 */

export interface SearchResult {
  title: string
  snippet: string
  url: string
}

/**
 * Search the web using Serper or Tavily API
 */
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const serperKey = process.env.SERPER_API_KEY
  const tavilyKey = process.env.TAVILY_API_KEY
  
  // Try Serper first (Google Search API)
  if (serperKey) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          num: 5
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return (data.organic || []).slice(0, 5).map((r: { title: string; snippet: string; link: string }) => ({
          title: r.title,
          snippet: r.snippet,
          url: r.link
        }))
      }
    } catch (e) {
      console.error('Serper search failed:', e)
    }
  }
  
  // Fallback to Tavily
  if (tavilyKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: query,
          max_results: 5,
          search_depth: 'basic'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return (data.results || []).slice(0, 5).map((r: { title: string; content: string; url: string }) => ({
          title: r.title,
          snippet: r.content,
          url: r.url
        }))
      }
    } catch (e) {
      console.error('Tavily search failed:', e)
    }
  }
  
  return []
}
