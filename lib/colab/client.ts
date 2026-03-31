/**
 * Colab chat client: POST /chat with messages, max_tokens; returns { response }.
 * Uses request wrapper (timeout, retry), mutex (no parallel requests), and response validation.
 * 
 * Also supports Ollama-compatible (OpenAI-compatible) API with streaming.
 */

import { getColabChatUrl, isColabConfigured, isOllamaConfigured, getOllamaChatUrl, OLLAMA_MODEL, OLLAMA_STREAM, OLLAMA_SYSTEM_PROMPT } from "./config"
import { fetchWithRetry } from "./request"
import { withMutex } from "./mutex"
import type { ColabMessage } from "./types"
import { isColabChatResponse, isOllamaChatResponse } from "./types"

const FALLBACK_MESSAGE =
  "The AI backend is unavailable. Check that your Colab server is running and the URL in .env is correct (COLAB_AI_BASE_URL, BITNET_BASE_URL, or OLLAMA_BASE_URL). If you just restarted Colab, update the URL. Slow responses? Increase COLAB_REQUEST_TIMEOUT_MS or AI_REQUEST_TIMEOUT in .env."

const TUNNEL_OFFLINE_MESSAGE =
  "The Colab tunnel appears to be offline. Please ensure your GPU-accelerated backend is running and the ngrok/static domain URL is accessible. You can verify by checking if the endpoint responds to health checks."

export interface ColabChatOptions {
  max_tokens?: number
  signal?: AbortSignal
}

export interface ColabChatResult {
  text: string
  fromFallback: boolean
}

export interface OllamaChatOptions {
  max_tokens?: number
  signal?: AbortSignal
  systemPrompt?: string
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

/**
 * Send chat request to Ollama-compatible backend (OpenAI-compatible API).
 * Supports streaming responses for real-time UI updates.
 * Returns the full response text or throws an error.
 */
export async function ollamaChat(
  messages: ColabMessage[],
  options: OllamaChatOptions = {}
): Promise<{ text: string; fromFallback: boolean }> {
  if (!isOllamaConfigured()) {
    return { text: FALLBACK_MESSAGE, fromFallback: true }
  }

  const url = getOllamaChatUrl()
  if (!url) return { text: FALLBACK_MESSAGE, fromFallback: true }

  const model = OLLAMA_MODEL
  const stream = OLLAMA_STREAM
  const max_tokens = options.max_tokens ?? 4096
  const systemPrompt = options.systemPrompt || OLLAMA_SYSTEM_PROMPT || ""

  let processedMessages = messages
  if (systemPrompt && !messages.some(m => m.role === "system")) {
    processedMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages
    ]
  }

  const body = JSON.stringify({
    model,
    messages: processedMessages,
    stream,
    max_tokens,
  })

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

    if (!res.ok) {
      const errorText = await res.text().catch(() => "")
      if (res.status >= 500) {
        return { text: TUNNEL_OFFLINE_MESSAGE, fromFallback: true }
      }
      return { text: `Ollama API error (${res.status}): ${errorText || res.statusText}`, fromFallback: true }
    }

    if (stream) {
      const text = await streamOllamaResponse(res, options.signal)
      return { text, fromFallback: false }
    }

    const data: unknown = await res.json()
    if (!isOllamaChatResponse(data)) {
      return { text: FALLBACK_MESSAGE, fromFallback: true }
    }

    const responseText = data.choices[0]?.message?.content?.trim() || ""
    if (!responseText) {
      return { text: "The model returned an empty response. Please try again or rephrase your question.", fromFallback: true }
    }

    return { text: responseText, fromFallback: false }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
      return { text: TUNNEL_OFFLINE_MESSAGE, fromFallback: true }
    }
    return { text: `${FALLBACK_MESSAGE} (${message})`, fromFallback: true }
  }
}

/**
 * Stream and accumulate response from Ollama API.
 */
async function streamOllamaResponse(
  response: Response,
  signal?: AbortSignal
): Promise<string> {
  if (!response.body) {
    throw new Error("Response body is null")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ""
  let buffer = ""

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel()
        break
      }

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.trim() === "" || !line.startsWith("data: ")) continue
        const data = line.slice(6).trim()
        if (data === "[DONE]") continue

        try {
          const chunk = JSON.parse(data)
          const content = chunk.choices?.[0]?.delta?.content
          if (content) {
            fullContent += content
          }
        } catch {
          // Skip invalid JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullContent.trim() || "The model returned an empty response. Please try again."
}

/**
 * Check if Ollama backend is available (health check via a simple API call).
 */
export async function checkOllamaHealth(): Promise<boolean> {
  if (!isOllamaConfigured()) return false

  try {
    const url = getOllamaChatUrl()
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: "ping" }],
        stream: false,
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}
