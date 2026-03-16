/**
 * Colab backend API contract (POST /chat).
 * Do not change unless the backend contract changes.
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
