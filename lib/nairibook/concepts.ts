import type { Chunk, Concept } from "./types"
import { callZen, tryParseJson } from "./zen"

const CONCEPT_SCHEMA = {
  name: "chapter_concepts",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      concepts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["title", "description"],
        },
      },
    },
    required: ["concepts"],
  },
}

// Extract atomic concepts from ONE chapter (not the whole book — respects
// free Zen API limits). Assigns concept_ids and links back to source chunks.
export async function extractConceptsForChapter(
  chapterIndex: number,
  chapterTitle: string,
  chapterChunks: Chunk[],
  signal?: AbortSignal
): Promise<Concept[]> {
  const chapterText = chapterChunks.map((c) => c.text).join("\n\n")
  const prompt = `You are analyzing an educational chapter to extract atomic concepts a reader must learn.
Chapter title: ${chapterTitle}

Chapter text:
"""
${chapterText}
"""

Extract the atomic concepts — individual facts, ideas, definitions, or skills the reader should understand.
For each concept provide a short title and a 1-2 sentence description.
Return only the JSON object defined by the schema.`

  let parsed: any = null
  try {
    const res = await callZen(prompt, { schema: CONCEPT_SCHEMA, maxTokens: 2048, signal })
    parsed = res.parsed
  } catch {
    parsed = null
  }
  if (!parsed || !Array.isArray(parsed.concepts)) {
    // Fallback: try to parse free-text response.
    try {
      const res = await callZen(prompt, { maxTokens: 2048, signal })
      parsed = tryParseJson(res.content)
    } catch {
      parsed = null
    }
  }

  const list: any[] = parsed?.concepts ?? []
  return list
    .map((c, i) => ({
      concept_id: `concept-${chapterIndex}-${i + 1}`,
      title: String(c.title ?? `Concept ${i + 1}`).slice(0, 200),
      description: String(c.description ?? "").slice(0, 600),
      chapter: chapterIndex,
      source_chunk_ids: chapterChunks.map((ch) => ch.id),
    }))
    .filter((c) => c.title && c.description)
}
