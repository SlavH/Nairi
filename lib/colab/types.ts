/**
 * Colab backend API contract (POST /chat).
 * Do not change unless the backend contract changes.
 * 
 * Also supports Ollama-compatible (OpenAI-compatible) API via OLLAMA_BASE_URL.
 */

export interface ColabMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ColabChatRequest {
  messages: ColabMessage[]
  max_tokens?: number
}

export interface ColabChatResponse {
  response: string
}

/** Validates that the parsed JSON has the shape we expect from Colab. */
export function isColabChatResponse(value: unknown): value is ColabChatResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "response" in value &&
    typeof (value as ColabChatResponse).response === "string"
  )
}

/**
 * Ollama/OpenAI-compatible API types.
 * Used when OLLAMA_BASE_URL is configured.
 */

export interface OllamaMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface OllamaChatRequest {
  model: string
  messages: OllamaMessage[]
  stream: boolean
  max_tokens?: number
}

export interface OllamaChatResponse {
  id: string
  model: string
  created_at: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
}

export interface OllamaStreamChunk {
  id: string
  model: string
  created_at: string
  choices: Array<{
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason?: string
  }>
}

/** Validates Ollama chat response. */
export function isOllamaChatResponse(value: unknown): value is OllamaChatResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "choices" in value &&
    Array.isArray((value as OllamaChatResponse).choices) &&
    (value as OllamaChatResponse).choices.length > 0 &&
    "message" in (value as OllamaChatResponse).choices[0] &&
    typeof (value as OllamaChatResponse).choices[0].message.content === "string"
  )
}
