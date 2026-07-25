import type { Chunk, ParsedDocument } from "./types"

const MAX_CHUNK_CHARS = 1000
const OVERLAP_CHARS = 120

// Split a chapter into chunks without breaking sentences. Uses Intl.Segmenter
// (where available) to find sentence boundaries; falls back to a regex.
function splitSentences(text: string): string[] {
  if (typeof (Intl as any).Segmenter !== "undefined") {
    const seg = new (Intl as any).Segmenter(undefined, { granularity: "sentence" })
    const out: string[] = []
    for (const s of seg.segment(text)) out.push(s.segment)
    return out
  }
  return text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text]
}

// Build chunks for a single chapter, preserving structure and overlap.
export function chunkDocument(doc: ParsedDocument, bookId: string): Chunk[] {
  const chunks: Chunk[] = []
  let globalPosition = 0

  for (const chapter of doc.chapters) {
    const sentences = splitSentences(chapter.text)
    let current = ""
    let startOffset = 0

    const flush = (text: string, start: number) => {
      const trimmed = text.trim()
      if (trimmed.length === 0) return
      chunks.push({
        id: `c-${chapter.index}-${chunks.length}`,
        book_id: bookId,
        chapter_index: chapter.index,
        chapter_title: chapter.title,
        position: globalPosition++,
        start_offset: start,
        end_offset: start + text.length,
        text: trimmed,
      })
    }

    for (const sentence of sentences) {
      if (current.length + sentence.length > MAX_CHUNK_CHARS && current.length > 0) {
        flush(current, startOffset)
        // Begin the next chunk with an overlap from the tail of the previous one.
        const overlap = current.slice(Math.max(0, current.length - OVERLAP_CHARS))
        current = overlap
        startOffset = startOffset + current.length - overlap.length
      }
      current += sentence
    }
    if (current.trim().length > 0) flush(current, startOffset)
  }

  return chunks
}
