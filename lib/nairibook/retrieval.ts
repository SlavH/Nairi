import type { Chunk } from "./types"
import { embedChunks, cosineSimilarity } from "./embeddings"

// Injectable query embedder (default: the shared transformers.js model).
// Allows tests to stub embeddings without loading the real model.
export type QueryEmbedder = (text: string) => Promise<Float32Array>

const DIM = 384 // all-MiniLM-L6-v2
const TOP_K = 5
const MIN_SCORE = 0.25 // cosine threshold below which we treat the doc as "no info"

export interface RetrievalChunk {
  id: string
  chapter_index: number
  chapter_title: string
  position: number
  text: string
}

export interface ScoredChunk {
  chunk: RetrievalChunk
  score: number
}

export interface RetrievalResult {
  found: boolean
  results: ScoredChunk[]
  bestScore: number
}

export interface RetrievalOptions {
  topK?: number
  minScore?: number
  embedQuery?: QueryEmbedder
}

// Build a query embedding and rank chunks by cosine similarity.
export async function retrieve(
  query: string,
  chunks: RetrievalChunk[],
  vectors: Float32Array[],
  opts: RetrievalOptions = {}
): Promise<RetrievalResult> {
  const topK = opts.topK ?? TOP_K
  const minScore = opts.minScore ?? MIN_SCORE
  const embedQuery = opts.embedQuery

  if (chunks.length === 0 || vectors.length === 0) {
    return { found: false, results: [], bestScore: 0 }
  }
  if (vectors.length !== chunks.length) {
    throw new Error("Vectors and chunks are out of sync for this document.")
  }

  // Embed the query with the same model used for the document.
  let qVec: Float32Array
  if (embedQuery) {
    qVec = await embedQuery(query)
  } else {
    const queryChunks: Chunk[] = [
      {
        id: "query",
        book_id: "query",
        chapter_index: -1,
        chapter_title: "",
        position: -1,
        start_offset: 0,
        end_offset: 0,
        text: query,
      },
    ]
    const { vectors: qVecs } = await embedChunks(queryChunks)
    qVec = qVecs[0]
  }

  const scored: ScoredChunk[] = chunks.map((chunk, i) => ({
    chunk,
    score: cosineSimilarity(qVec, vectors[i]),
  }))

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, topK)

  // Connectivity: if top chunks come from one chapter and are adjacent in
  // position, pull in neighbouring chunks from that chapter for coherence.
  const expanded = expandNeighbors(top, scored, chunks, vectors)

  const bestScore = top[0]?.score ?? 0
  return {
    found: bestScore >= minScore,
    results: expanded,
    bestScore,
  }
}

function expandNeighbors(
  top: ScoredChunk[],
  all: ScoredChunk[],
  chunks: RetrievalChunk[],
  vectors: Float32Array[]
): ScoredChunk[] {
  const seen = new Set(top.map((t) => t.chunk.id))
  const extra: ScoredChunk[] = []
  for (const t of top) {
    const sameChapter = chunks.filter((c) => c.chapter_index === t.chunk.chapter_index)
    const idxInChapter = sameChapter.findIndex((c) => c.id === t.chunk.id)
    for (const off of [-1, 1]) {
      const neighbor = sameChapter[idxInChapter + off]
      if (neighbor && !seen.has(neighbor.id)) {
        seen.add(neighbor.id)
        const vi = chunks.findIndex((c) => c.id === neighbor.id)
        extra.push({ chunk: neighbor, score: vectors.length ? all[vi]?.score ?? 0 : 0 })
      }
    }
  }
  return [...top, ...extra].sort((a, b) => b.score - a.score)
}
