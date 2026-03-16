/**
 * Server-side HF Space client: health (with wake-up retries) and chat (with timeout + empty retry).
 * Used by /api/nairi-chat. Do not send system prompt; backend has its own (Nairi identity).
 */

const HF_BASE = (process.env.NAIRI_HF_BASE_URL ?? process.env.NAIRI_AI_BASE_URL ?? "").trim().replace(/\/+$/, "")
const HEALTH_URL = HF_BASE ? `${HF_BASE}/health` : ""
const CHAT_URL = HF_BASE ? `${HF_BASE}/chat` : ""
const HEALTH_TIMEOUT_MS = 5_000
const CHAT_TIMEOUT_MS = 60_000
const HEALTH_RETRIES = 2
const HEALTH_BACKOFF_MS = [3000, 6000]
const EMPTY_RESPONSE_RETRY_DELAY_MS = 2000

export function isHfConfigured(): boolean {
  return HF_BASE.length > 0
}

export async function hfHealth(): Promise<boolean> {
  if (!HEALTH_URL) return false
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
  try {
    const res = await fetch(HEALTH_URL, { method: "GET", signal: controller.signal })
    clearTimeout(id)
    const data = (await res.json()) as { status?: string }
    return res.ok && data?.status === "ok"
  } catch {
    clearTimeout(id)
    return false
  }
}

/**
 * Wake up: health check with up to 2 retries and backoff 3s, 6s.
 */
export async function hfEnsureHealthy(): Promise<boolean> {
  for (let attempt = 0; attempt <= HEALTH_RETRIES; attempt++) {
    if (await hfHealth()) return true
    if (attempt < HEALTH_RETRIES) {
      await new Promise((r) => setTimeout(r, HEALTH_BACKOFF_MS[attempt]))
    }
  }
  return false
}

export interface HfChatMessage {
  role: "user" | "assistant"
  content: string
}

function isHfChatResponse(v: unknown): v is { response: string } {
  return typeof v === "object" && v !== null && "response" in v && typeof (v as { response: unknown }).response === "string"
}

/**
 * Single HF /chat call. Timeout 60s. If empty response, retry once after 2s.
 */
export async function hfChat(messages: HfChatMessage[], max_tokens: number): Promise<string> {
  if (!CHAT_URL) throw new Error("HF chat URL not configured")
  let lastErr: Error | null = null
  for (let attempt = 0; attempt <= 1; attempt++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS)
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, max_tokens }),
        signal: controller.signal,
      })
      clearTimeout(id)
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok) {
        lastErr = new Error((data as { detail?: string })?.detail ?? res.statusText ?? "HF error")
        throw lastErr
      }
      if (!isHfChatResponse(data)) {
        lastErr = new Error("Invalid HF response shape")
        throw lastErr
      }
      const text = (data.response as string).trim()
      if (text) return text
      lastErr = new Error("Empty response")
    } catch (e) {
      clearTimeout(id)
      lastErr = e instanceof Error ? e : new Error(String(e))
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, EMPTY_RESPONSE_RETRY_DELAY_MS))
  }
  throw lastErr ?? new Error("HF chat failed")
}
