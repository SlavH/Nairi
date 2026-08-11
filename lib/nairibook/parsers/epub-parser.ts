import type { ParsedChapter, ParsedDocument } from "../types"

// Lazy-loaded epub.js parser. epubjs exposes a TOC (table of contents) which
// gives reliable chapter/section hierarchy, better than PDF heuristics.
export async function parseEpub(file: File): Promise<ParsedDocument> {
  const epubjs = await import("epubjs")
  const BookCtor = ((epubjs as any).default ?? epubjs) as any
  const book = BookCtor(file)

  // Wait for the book to be ready and the spine/toc to load.
  await book.ready
  const toc = (book.navigation && book.navigation.toc) || []

  const chapters: ParsedChapter[] = []

  if (toc.length > 0) {
    for (const item of toc) {
      const href = item.href
      try {
        const section = book.spine.get(href) || (book.spine.get as any)(item.id)
        if (!section) continue
        const contents = await section.load(book.load.bind(book))
        const text = (contents && contents.textContent) || stripHtml(section && (section.contents?.document?.body?.textContent || ""))
        chapters.push({
          index: chapters.length,
          title: item.label?.trim() || `Section ${chapters.length + 1}`,
          level: item.level ?? 1,
          text: String(text).trim(),
        })
        if (section.unload) section.unload()
      } catch {
        // Skip sections that fail to load rather than aborting the whole book.
        continue
      }
    }
  } else {
    // Fallback: iterate the spine directly.
    for (const section of book.spine.spineItems || []) {
      try {
        const contents = await section.load(book.load.bind(book))
        const text = String((contents && contents.textContent) || "").trim()
        if (text) {
          chapters.push({ index: chapters.length, title: `Section ${chapters.length + 1}`, level: 1, text })
        }
      } catch {
        continue
      }
    }
  }

  if (chapters.length === 0) {
    chapters.push({ index: 0, title: file.name.replace(/\.epub$/i, "") || "EPUB Document", level: 1, text: "" })
  }

  const title = (book.packaging && book.packaging.metadata && book.packaging.metadata.title) || file.name.replace(/\.epub$/i, "") || "EPUB Document"

  return { title: String(title), format: "epub", chapters }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
