import { describe, it, expect } from "vitest"
import { retrieve, type QueryEmbedder } from "@/lib/nairibook/retrieval"

// Fake embeddings: deterministic unit vectors so cosine is exact.
function unit(dim: number, hot: number): Float32Array {
  const v = new Float32Array(dim)
  v[hot] = 1
  return v
}

const DIM = 384

const chunks = [
  { id: "c-0-0", chapter_index: 0, chapter_title: "Forces", position: 0, text: "Newton's first law of inertia." },
  { id: "c-0-1", chapter_index: 0, chapter_title: "Forces", position: 1, text: "Newton's second law F equals m a." },
  { id: "c-1-0", chapter_index: 1, chapter_title: "Energy", position: 2, text: "Kinetic energy depends on mass and velocity." },
  { id: "c-1-1", chapter_index: 1, chapter_title: "Energy", position: 3, text: "Potential energy depends on height." },
]

const vectors = [unit(DIM, 0), unit(DIM, 1), unit(DIM, 2), unit(DIM, 3)]

describe("NairiBook retrieval", () => {
  it("returns top-K chunks ranked by cosine similarity", async () => {
    const q: QueryEmbedder = async () => unit(DIM, 1) // matches c-0-1
    const res = await retrieve("second law", chunks, vectors, { topK: 2, minScore: 0, embedQuery: q })
    expect(res.results.length).toBeGreaterThan(0)
    expect(res.results[0].chunk.id).toBe("c-0-1")
  })

  it("reports not-found when best score is below threshold", async () => {
    const q: QueryEmbedder = async () => unit(DIM, 200) // orthogonal to all chunks
    const res = await retrieve("unrelated topic", chunks, vectors, { topK: 5, minScore: 0.25, embedQuery: q })
    expect(res.found).toBe(false)
    expect(res.bestScore).toBeLessThan(0.25)
  })

  it("throws when vectors and chunks are out of sync", async () => {
    const q: QueryEmbedder = async () => unit(DIM, 0)
    await expect(retrieve("q", chunks, [unit(DIM, 0)], { embedQuery: q })).rejects.toThrow(/out of sync/)
  })

  it("expands neighbouring chunks within the same chapter", async () => {
    const q: QueryEmbedder = async () => unit(DIM, 1) // hits c-0-1
    const res = await retrieve("second law", chunks, vectors, { topK: 1, minScore: 0, embedQuery: q })
    // c-0-0 is the neighbour of c-0-1 within chapter 0 → should be included.
    expect(res.results.some((r) => r.chunk.id === "c-0-0")).toBe(true)
  })
})
