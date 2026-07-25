import type { ParsedChapter, ParsedDocument, BookFormat } from "../types"

// Heuristics for detecting chapter/section headings in plain text and markdown.
const HEADING_RE = /^(#{1,6})\s+(.+)$/ // markdown headings
const CHAPTER_RE = /^\s*(chapter|section|part|unit|глава|раздел|часть|том)\b[ \t]*([0-9]+|[IVXLC]+)?[ \t:.]*[-–]?[ \t]*(.*)$/i

export function parseText(content: string, title: string, format: BookFormat): ParsedDocument {
  const lines = content.split(/\r?\n/)
  const chapters: ParsedChapter[] = []
  let current: ParsedChapter | null = null
  let buffer: string[] = []

  const flush = () => {
    if (current) {
      current.text = buffer.join("\n").trim()
      if (current.text.length > 0) chapters.push(current)
    }
    buffer = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const md = line.match(HEADING_RE)
    const chap = line.match(CHAPTER_RE)
    if (md) {
      flush()
      current = { index: chapters.length, title: md[2].trim() || `Section ${chapters.length + 1}`, level: md[1].length, text: "" }
    } else if (chap && line.trim().length > 0 && line.trim().length < 120) {
      flush()
      const label = (chap[3] || chap[2] || chap[1] || "").trim()
      current = {
        index: chapters.length,
        title: (chap[1] + (label ? " " + label : "") + (chap[4] ? " " + chap[4] : "")).trim(),
        level: 1,
        text: "",
      }
    } else {
      buffer.push(line)
    }
  }
  flush()

  if (chapters.length === 0) {
    // No structure detected — treat the whole document as a single chapter.
    chapters.push({ index: 0, title: title || "Document", level: 1, text: content.trim() })
  }

  return { title: title || "Untitled", format, chapters }
}
