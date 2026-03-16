/**
 * Colab chat client: POST /chat with messages, max_tokens; returns { response }.
 * Uses request wrapper (timeout, retry), mutex (no parallel requests), and response validation.
 */

import { getColabChatUrl, isColabConfigured } from "./config"
import { fetchWithRetry } from "./request"
import { withMutex } from "./mutex"
import type { ColabMessage } from "./types"
import { isColabChatResponse } from "./types"

const FALLBACK_MESSAGE =
  "The AI backend is unavailable. Check that your Colab server is running and the URL in .env is correct (COLAB_AI_BASE_URL or BITNET_BASE_URL). If you just restarted Colab, update the URL. Slow responses? Increase COLAB_REQUEST_TIMEOUT_MS or AI_REQUEST_TIMEOUT in .env."

export interface ColabChatOptions {
  max_tokens?: number
  signal?: AbortSignal
}

export interface ColabChatResult {
  text: string
  fromFallback: boolean
}

/**
 * Send chat request to Colab backend. Single flight (mutex), timeout, retry, validation.
 * Returns fallback message if backend is unavailable or response invalid.
 */
export async function colabChat(
  messages: ColabMessage[],
  options: ColabChatOptions = {}
): Promise<ColabChatResult> {
  if (!isColabConfigured()) {
    return { text: FALLBACK_MESSAGE, fromFallback: true }
  }

  const url = getColabChatUrl()
  if (!url) return { text: FALLBACK_MESSAGE, fromFallback: true }

  const max_tokens = options.max_tokens ?? 300
  const body = JSON.stringify({ messages, max_tokens })

  const result = await withMutex(async () => {
    try {
      const res = await fetchWithRetry(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: options.signal,
        }
      )
      const data: unknown = await res.json()
      if (!isColabChatResponse(data)) {
        return { text: FALLBACK_MESSAGE, fromFallback: true }
      }
      const responseText = typeof data.response === "string" ? data.response.trim() : ""
      if (!responseText) {
        return { text: "The model returned an empty response. Please try again or rephrase your question.", fromFallback: true }
      }
      return { text: data.response, fromFallback: false }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        text: `${FALLBACK_MESSAGE} (${message})`,
        fromFallback: true,
      }
    }
  })

  return result
}
