import { idbPut, idbGet, idbDelete, STORES } from "./db"

export interface ChatTurn {
  turnId: string
  role: "user" | "assistant"
  content: string
  sources?: RagSourceLite[]
  createdAt: number
}

interface RagSourceLite {
  chapterIndex: number
  chapterTitle: string
  text: string
  score: number
}

interface ChatHistoryRecord {
  notebookId: string
  turns: ChatTurn[]
  updatedAt: number
}

interface FeedbackRecord {
  notebookId: string
  turnId: string
  helpful: boolean
  createdAt: number
}

// Persist the full chat history for a notebook (single record, keyed by id).
export async function saveChatTurns(notebookId: string, turns: ChatTurn[]): Promise<void> {
  const record: ChatHistoryRecord = { notebookId, turns, updatedAt: Date.now() }
  await idbPut(STORES.ragChat, record)
}

export async function loadChatHistory(notebookId: string): Promise<ChatTurn[]> {
  const rec = await idbGet<ChatHistoryRecord>(STORES.ragChat, notebookId)
  return rec?.turns ?? []
}

export async function clearChat(notebookId: string): Promise<void> {
  await idbDelete(STORES.ragChat, notebookId)
}

// Optional quality signal: was the answer helpful?
export async function saveFeedback(notebookId: string, turnId: string, helpful: boolean): Promise<void> {
  const rec: FeedbackRecord = { notebookId, turnId, helpful, createdAt: Date.now() }
  await idbPut(STORES.ragFeedback, rec)
}
