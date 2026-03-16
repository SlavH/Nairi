/**
 * RAG pipeline: ingest docs into embeddings (Supabase pgvector or external), inject retrieved chunks into context.
 * Use NAIRI_EMBEDDING_PROVIDER and Supabase pgvector when enabled.
 */

export interface RAGChunk {
  id: string
  content: string
  metadata?: Record<string, unknown>
  score?: number
}

export interface RAGConfig {
  topK?: number
  minScore?: number
}

const DEFAULT_TOP_K = 5

/**
 * Retrieve relevant chunks for a query. Override with real pgvector/embedding when Supabase and embeddings are configured.
 */
export async function retrieve(
  _query: string,
  _options?: { userId?: string; knowledgeBaseId?: string } & RAGConfig
): Promise<RAGChunk[]> {
  // Stub: when pgvector and embedding API are wired, query embeddings and return chunks.
  return []
}

/**
 * Format retrieved chunks for injection into system or user context.
 */
export function formatChunksForContext(chunks: RAGChunk[]): string {
  if (chunks.length === 0) return ""
  return "\n[Relevant context]\n" + chunks.map((c, i) => `(${i + 1}) ${c.content}`).join("\n\n")
}
