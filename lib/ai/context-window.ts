/**
 * Context window optimization: summarize or truncate long conversations before sending to model.
 * Preserve recent turns and key facts to stay within model limits.
 */

export const DEFAULT_MAX_MESSAGES = 20
export const DEFAULT_MAX_CHARS = 80_000
const SUMMARY_PREFIX = "[Earlier context summarized] "

export interface ContextMessage {
  role: "system" | "user" | "assistant"
  content: string
}

/**
 * Truncate messages to fit within maxMessages (keep most recent) and optionally maxChars.
 * If over limit, keep system (if any), then recent user/assistant pairs.
 */
export function truncateMessages(
  messages: ContextMessage[],
  maxMessages: number = DEFAULT_MAX_MESSAGES,
  maxChars?: number
): ContextMessage[] {
  if (messages.length <= maxMessages && !maxChars) return messages

  const systemMessages = messages.filter((m) => m.role === "system")
  const rest = messages.filter((m) => m.role !== "system")
  const take = Math.max(0, rest.length - maxMessages)
  let out: ContextMessage[] = [...systemMessages, ...rest.slice(take)]

  if (maxChars) {
    let total = 0
    const reversed = [...out].reverse()
    const kept: ContextMessage[] = []
    for (const m of reversed) {
      if (total + m.content.length > maxChars && kept.length >= 2) break
      kept.unshift(m)
      total += m.content.length
    }
    if (kept.length < out.length) {
      out = [...systemMessages, { role: "user", content: SUMMARY_PREFIX + "Previous messages truncated. Most recent conversation:" }, ...kept.filter((m) => m.role !== "system")]
    }
  }
  return out
}

/**
 * Build a short summary placeholder for dropped middle messages (for future use with summarizer).
 */
export function getSummaryPlaceholder(droppedCount: number): string {
  return `${SUMMARY_PREFIX}${droppedCount} earlier message(s) omitted for length.`
}
