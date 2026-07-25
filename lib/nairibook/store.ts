import type { BookCore, Chunk, Concept, ConceptGraph } from "./types"
import { idbPut, idbGet, idbGetAll, idbDelete, STORES } from "./db"
import { saveVectors, loadVectors, isOpfsAvailable } from "./opfs"

interface BookMeta {
  book_id: string
  title: string
  format: BookCore["format"]
  created_at: number
  chapter_titles: string[]
  // lightweight status for the UI library list
  chunk_count: number
  concept_count: number
  processed: boolean
}

export interface LoadedBook extends BookCore {
  vectors: Float32Array[]
}

// Persist the full core: metadata + chunks + concepts + graph in IndexedDB,
// vectors in OPFS. This is the single write path future features rely on.
export async function saveBookCore(core: BookCore, vectors: Float32Array[]): Promise<void> {
  const meta: BookMeta = {
    book_id: core.book_id,
    title: core.title,
    format: core.format,
    created_at: core.created_at,
    chapter_titles: core.chapter_titles,
    chunk_count: core.chunks.length,
    concept_count: core.concepts.length,
    processed: true,
  }
  await idbPut(STORES.books, meta)
  await idbPut(STORES.chunks, { book_id: core.book_id, chunks: core.chunks })
  await idbPut(STORES.concepts, { book_id: core.book_id, concepts: core.concepts })
  await idbPut(STORES.graphs, { book_id: core.book_id, graph: core.graph })
  await saveVectors(core.book_id, vectors)
}

export async function loadBookCore(bookId: string): Promise<LoadedBook | null> {
  const [meta, chunkRec, conceptRec, graphRec] = await Promise.all([
    idbGet<BookMeta>(STORES.books, bookId),
    idbGet<{ book_id: string; chunks: Chunk[] }>(STORES.chunks, bookId),
    idbGet<{ book_id: string; concepts: Concept[] }>(STORES.concepts, bookId),
    idbGet<{ book_id: string; graph: ConceptGraph }>(STORES.graphs, bookId),
  ])
  if (!meta || !chunkRec || !conceptRec || !graphRec) return null
  const vectors = await loadVectors(bookId)
  return {
    book_id: meta.book_id,
    title: meta.title,
    format: meta.format,
    created_at: meta.created_at,
    chapter_titles: meta.chapter_titles,
    chunks: chunkRec.chunks,
    concepts: conceptRec.concepts,
    graph: graphRec.graph,
    vectors,
  }
}

export async function listBooks(): Promise<BookMeta[]> {
  const all = await idbGetAll<BookMeta>(STORES.books)
  return all.sort((a, b) => b.created_at - a.created_at)
}

export async function deleteBook(bookId: string): Promise<void> {
  await Promise.all([
    idbDelete(STORES.books, bookId),
    idbDelete(STORES.chunks, bookId),
    idbDelete(STORES.concepts, bookId),
    idbDelete(STORES.graphs, bookId),
    idbDelete(STORES.vectors, bookId), // IDB fallback vectors
  ])
  // vectors file in OPFS can be left; best-effort removal:
  if (isOpfsAvailable()) {
    try {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(`${bookId}.vec`)
    } catch {
      /* ignore */
    }
  }
}
