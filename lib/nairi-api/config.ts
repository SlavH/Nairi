/**
 * Nairi HF Space backend configuration.
 * Set NAIRI_HF_BASE_URL or NAIRI_AI_BASE_URL in .env (e.g. https://slavnairi-nairi-generation.hf.space).
 * Switching to VPS: only change the base URL.
 */

const raw = process.env.NAIRI_HF_BASE_URL ?? process.env.NAIRI_AI_BASE_URL ?? ""
export const NAIRI_AI_BASE_URL = raw.trim().replace(/\/+$/, "")

export const NAIRI_HEALTH_PATH = "/health"
export const NAIRI_CHAT_PATH = "/chat"

export const NAIRI_HEALTH_TIMEOUT_MS = 5_000
export const NAIRI_CHAT_TIMEOUT_MS = 60_000

export function getNairiHealthUrl(): string {
  return NAIRI_AI_BASE_URL ? `${NAIRI_AI_BASE_URL}${NAIRI_HEALTH_PATH}` : ""
}

export function getNairiChatUrl(): string {
  return NAIRI_AI_BASE_URL ? `${NAIRI_AI_BASE_URL}${NAIRI_CHAT_PATH}` : ""
}

export function isNairiConfigured(): boolean {
  return NAIRI_AI_BASE_URL.length > 0
}
