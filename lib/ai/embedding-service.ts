/**
 * Embedding service: dedicated API for embeddings (documents, search); reuse for RAG and semantic search.
 */

export interface EmbeddingResult {
  embedding: number[]
  model: string
}

/**
 * Get embedding for a single text. Stub until embedding provider (OpenAI, Supabase, etc.) is wired.
 */
export async function embed(text: string, _options?: { model?: string }): Promise<EmbeddingResult> {
  return { embedding: [], model: "stub" }
}

/**
 * Get embeddings for multiple texts in one call when supported.
 */
export async function embedMany(texts: string[], _options?: { model?: string }): Promise<EmbeddingResult[]> {
  return texts.map(() => ({ embedding: [], model: "stub" }))
}
