import { chunkDocument } from "./chunking"
import { idbPut, idbGet, STORES } from "./db"
import { embedChunks } from "./embeddings"
import { saveVectors, loadVectors } from "./opfs"
import type { RetrievalChunk } from "./retrieval"
import type { Chunk } from "./types"

interface NotebookSource {
  id: string
  title: string
  content: string
}

export interface NotebookDoc {
  notebookId: string
  title: string
  chunks: RetrievalChunk[]
  vectors: Float32Array[]
  chapterTitles: string[]
  builtAt: number
}

interface NotebookDocMeta {
  notebookId: string
  title: string
  chunkCount: number
  builtAt: number
}

// Convert notebook sources into a retrieval document. Sources are treated as
// chapters (one per source) so citations map to "Глава N" = source N.
// Embeddings are computed once and cached in OPFS (vectors) + IndexedDB (meta),
// keyed by notebookId, so repeated chats don't re-embed.
export async function buildNotebookDoc(
  notebookId: string,
  sources: NotebookSource[],
  onProgress?: (msg: string) => void
): Promise<NotebookDoc> {
  const parsed = {
    title: "Notebook",
    format: "text" as const,
    chapters: sources.map((s, i) => ({
      index: i,
      title: s.title || `Source ${i + 1}`,
      level: 1,
      text: s.content,
    })),
  }

  const chunks: Chunk[] = chunkDocument(parsed, notebookId)
  const retrievalChunks: RetrievalChunk[] = chunks.map((c) => ({
    id: c.id,
    chapter_index: c.chapter_index,
    chapter_title: c.chapter_title,
    position: c.position,
    text: c.text,
  }))

  onProgress?.("Computing embeddings…")
  const { vectors } = await embedChunks(chunks, (done, total) =>
    onProgress?.(`Embedding ${done}/${total} chunks…`)
  )

  onProgress?.("Caching locally…")
  await saveVectors(`rag-${notebookId}`, vectors)
  await idbPut(STORES.chunks, { book_id: notebookId, chunks })
  const meta: NotebookDocMeta = {
    notebookId,
    title: "Notebook",
    chunkCount: chunks.length,
    builtAt: Date.now(),
  }
  await idbPut(STORES.books, { ...meta, ragVectorsKey: `rag-${notebookId}` })

  return {
    notebookId,
    title: "Notebook",
    chunks: retrievalChunks,
    vectors,
    chapterTitles: parsed.chapters.map((c) => c.title),
    builtAt: meta.builtAt,
  }
}

// Load a previously cached notebook document (vectors from OPFS).
export async function loadNotebookDoc(notebookId: string): Promise<NotebookDoc | null> {
  const meta = await idbGet<NotebookDocMeta & { ragVectorsKey: string }>(STORES.books, notebookId)
  if (!meta) return null
  const vectors = await loadVectors(meta.ragVectorsKey || `rag-${notebookId}`)
  if (vectors.length === 0) return null

  // Rebuild chunks from the stored meta is not possible (chunks live in chunks
  // store under book_id). For RAG we stored under notebookId as book_id, so:
  const chunkRec = await idbGet<{ book_id: string; chunks: Chunk[] }>(STORES.chunks, notebookId)
  if (!chunkRec) return null
  const retrievalChunks: RetrievalChunk[] = chunkRec.chunks.map((c) => ({
    id: c.id,
    chapter_index: c.chapter_index,
    chapter_title: c.chapter_title,
    position: c.position,
    text: c.text,
  }))

  return {
    notebookId,
    title: meta.title,
    chunks: retrievalChunks,
    vectors,
    chapterTitles: retrievalChunks.map((c) => c.chapter_title),
    builtAt: meta.builtAt,
  }
}
