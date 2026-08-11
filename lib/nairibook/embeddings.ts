import type { Chunk } from "./types"

// Browser-side embeddings via transformers.js (Xenova/all-MiniLM-L6-v2).
// WebGPU preferred, WASM/CPU fallback. Model loads lazily on first use.

const MODEL_ID = "Xenova/all-MiniLM-L6-v2"
let extractor: any = null
let usingWebGPU = false

export interface EmbeddingResult {
  vectors: Float32Array[] // L2-normalized, parallel to `chunks`
  device: "webgpu" | "wasm"
}

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator
}

async function getExtractor() {
  if (extractor) return { extractor, usingWebGPU }
  const transformers = await import("@huggingface/transformers")
  const device = isWebGPUAvailable() ? "webgpu" : "wasm"
  extractor = await transformers.pipeline("feature-extraction", MODEL_ID, {
    device,
    dtype: device === "webgpu" ? "fp32" : "q8",
  })
  usingWebGPU = device === "webgpu"
  return { extractor, usingWebGPU }
}

// Embed a list of chunks in batches, reporting progress. Vectors are L2
// normalized so cosine similarity == dot product at query time.
export async function embedChunks(
  chunks: Chunk[],
  onProgress?: (done: number, total: number) => void
): Promise<EmbeddingResult> {
  const { extractor: ex, usingWebGPU: gpu } = await getExtractor()
  const vectors: Float32Array[] = []
  const BATCH = 8
  const total = chunks.length

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const out = await ex(
      batch.map((c) => c.text),
      { pooling: "mean", normalize: true }
    )
    // out is a Tensor; .tolist() gives number[][], data gives flat Float32Array
    const data: number[] | Float32Array = out.data ?? out.tolist()
    for (let b = 0; b < batch.length; b++) {
      const row = Array.isArray(data) ? data : data
      // When data is flat across the batch, slice the correct row.
      const dim = row.length / batch.length
      const start = b * dim
      vectors.push(Float32Array.from(row.slice(start, start + dim)))
    }
    onProgress?.(Math.min(i + BATCH, total), total)
  }

  return { vectors, device: gpu ? "webgpu" : "wasm" }
}

// Cosine similarity via dot product (vectors are pre-normalized).
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) dot += a[i] * b[i]
  return dot
}
