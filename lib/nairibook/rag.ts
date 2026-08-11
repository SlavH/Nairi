import type { RetrievalChunk, RetrievalResult } from "./retrieval"
import { retrieve } from "./retrieval"
import { streamZen } from "./zen"
import { truncateMessages, type ContextMessage } from "@/lib/ai/context-window"

const NO_INFO_MARKER = "NO_DOCUMENT_INFO"

export interface RagSource {
  chapterIndex: number
  chapterTitle: string
  text: string
  score: number
}

export interface RagChatInput {
  query: string
  chunks: RetrievalChunk[]
  vectors: Float32Array[]
  history: ContextMessage[]
  signal?: AbortSignal
  onToken?: (delta: string) => void
  onSources?: (sources: RagSource[]) => void
}

export interface RagChatOutput {
  answer: string
  sources: RagSource[]
  found: boolean
}

// Build the strict grounding prompt. Mirrors the approved system prompt.
export function buildRagPrompt(query: string, retrieved: RetrievalResult, history: ContextMessage[]): string {
  const blocks = retrieved.results
    .map(
      (r, i) =>
        `--- Источник [${i + 1}] (Глава ${r.chunk.chapter_index + 1}: ${r.chunk.chapter_title}) ---\n${r.chunk.text}`
    )
    .join("\n\n")

  const historyText = history.length
    ? "\nПРЕДЫДУЩИЙ ДИАЛОГ:\n" +
      history.map((m) => `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`).join("\n")
    : ""

  const system = `Ты — ассистент по конкретному документу (книге/учебнику). Твоя задача — отвечать на вопросы пользователя СТРОГО на основе предоставленных ниже фрагментов документа.

ЖЁСТКИЕ ПРАВИЛА:
1. Используй ТОЛЬКО информацию из блоков ИСТОЧНИК ниже. НЕ используй свои общие знания, не дополняй ответ фактами вне документа.
2. Рядом с каждым утверждением, взятым из фрагмента, ставь метку [Глава N], где N — номер главы этого фрагмента.
3. Если в предоставленных фрагментах НЕТ информации для ответа на вопрос (или её недостаточно), ты ОБЯЗАН прямо написать: «В загруженном документе не нашлось достаточной информации по этому вопросу.» — и НЕ пытаться отвечать из общих знаний.
4. Будь точным: не пересказывай лишнее, не выдумывай детали, цифры и имена, которых нет в источниках.
5. В конце ответа добавь строку: «Использованные главы: N, M…» — перечисли номера глав из использованных фрагментов.

ФОРМАТ ИСТОЧНИКОВ:
${blocks}

ВОПРОС ПОЛЬЗОВАТЕЛЯ: ${query}${historyText}`

  return system
}

// Run a single RAG turn: retrieve, short-circuit if nothing relevant, else
// stream the grounded answer.
export async function runRagChat(input: RagChatInput): Promise<RagChatOutput> {
  const { query, chunks, vectors, history, signal, onToken, onSources } = input

  const retrieved = await retrieve(query, chunks, vectors)

  const sources: RagSource[] = retrieved.results.map((r) => ({
    chapterIndex: r.chunk.chapter_index,
    chapterTitle: r.chunk.chapter_title,
    text: r.chunk.text,
    score: r.score,
  }))
  onSources?.(sources)

  if (!retrieved.found) {
    return {
      answer:
        "В загруженном документе не нашлось достаточной информации по этому вопросу.",
      sources: [],
      found: false,
    }
  }

  // Window the history so we stay within the model context.
  const windowed = truncateMessages(history, 20, 80_000)
  const prompt = buildRagPrompt(query, retrieved, windowed)

  let answer = ""
  for await (const delta of streamZen(prompt, { maxTokens: 2048, signal })) {
    answer += delta
    onToken?.(delta)
  }

  return { answer, sources, found: true }
}
