/**
 * Colab AI backend configuration.
 * Base URL is read from env; all Colab requests use this base (e.g. ngrok URL).
 * Switching to VPS later: only change COLAB_AI_BASE_URL.
 */

const raw = process.env.COLAB_AI_BASE_URL ?? process.env.BITNET_BASE_URL ?? ""
export const COLAB_AI_BASE_URL = raw.trim().replace(/\/+$/, "") // no trailing slash

/** Request timeout in ms. Colab can be slow (CPU ~5–10s, cold start, load); default 60s. Override with COLAB_REQUEST_TIMEOUT_MS or AI_REQUEST_TIMEOUT. */
export const COLAB_REQUEST_TIMEOUT_MS =
  Number(process.env.COLAB_REQUEST_TIMEOUT_MS) || Number(process.env.AI_REQUEST_TIMEOUT) || 60_000

/** Max retries for retryable failures (network, 5xx). Total attempts = 1 + COLAB_MAX_RETRIES */
export const COLAB_MAX_RETRIES = Math.min(2, Math.max(0, Number(process.env.AI_MAX_RETRIES) || 2))

/** Path for chat (appended to base URL). */
export const COLAB_CHAT_PATH = "/chat"

/** Path for health check (optional; GET). */
export const COLAB_HEALTH_PATH = "/health"

export function getColabChatUrl(): string {
  if (!COLAB_AI_BASE_URL) return ""
  return `${COLAB_AI_BASE_URL}${COLAB_CHAT_PATH}`
}

export function getColabHealthUrl(): string {
  if (!COLAB_AI_BASE_URL) return ""
  return `${COLAB_AI_BASE_URL}${COLAB_HEALTH_PATH}`
}

export function isColabConfigured(): boolean {
  return COLAB_AI_BASE_URL.length > 0
}
