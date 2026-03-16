/**
 * Citation and grounding: parse model output for sources, display in UI.
 * For debate/knowledge features, require model to cite sources; parse and expose.
 */

export interface Citation {
  index: number
  text: string
  source?: string
  url?: string
}

const CITE_PATTERNS = [
  /\[(\d+)\]/g,
  /\(([^)]*source[^)]*)\)/gi,
  /\[([^\]]+)\]\(([^)]+)\)/g,
]

/**
 * Extract citation-like spans from assistant text (e.g. [1], (Source: url)).
 */
export function parseCitations(text: string): Citation[] {
  const citations: Citation[] = []
  const seen = new Set<string>()
  for (const pattern of CITE_PATTERNS) {
    let m: RegExpExecArray | null
    const re = new RegExp(pattern.source, pattern.flags)
    while ((m = re.exec(text)) !== null) {
      const key = `${m.index}-${m[0]}`
      if (seen.has(key)) continue
      seen.add(key)
      citations.push({
        index: citations.length + 1,
        text: m[0],
        source: m[1],
        url: m[2],
      })
    }
  }
  return citations
}

/**
 * Instruction snippet to append to system prompt when citations are required.
 */
export const REQUIRE_CITATIONS_INSTRUCTION = `
When using facts or claims, cite sources with [1], [2], or (Source: name). Include a short sources list at the end when applicable.`
