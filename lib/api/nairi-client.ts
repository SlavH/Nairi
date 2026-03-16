/**
 * Nairi API client (browser). Calls Next.js API routes that proxy to HF Space.
 * - healthCheck(): GET /api/nairi/health, 5s timeout
 * - sendChat(messages, maxTokens): POST /api/nairi/chat, 60s timeout, response validation
 */

import type { NairiMessage, NairiChatResponse, NairiHealthResponse } from "@/lib/nairi-api/types"
import { isNairiChatResponse, isNairiHealthResponse } from "@/lib/nairi-api/types"

const HEALTH_TIMEOUT_MS = 5_000
const CHAT_TIMEOUT_MS = 60_000

export type HealthResult = { ok: boolean; name?: string; model?: string }

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

/**
 * GET /api/nairi/health with 5s timeout.
 */
export async function healthCheck(): Promise<HealthResult> {
  const res = await fetchWithTimeout("/api/nairi/health", { method: "GET" }, HEALTH_TIMEOUT_MS)
  const data: unknown = await res.json().catch(() => ({}))
  const ok = res.ok && isNairiHealthResponse(data) && (data as NairiHealthResponse).status === "ok"
  return {
    ok,
    name: isNairiHealthResponse(data) ? (data as NairiHealthResponse).name : undefined,
    model: isNairiHealthResponse(data) ? (data as NairiHealthResponse).model : undefined,
  }
}

export type SendChatResult = { response: string; latency_sec?: number }

export interface NairiChatSource {
  id: number
  title: string
  url: string
  snippet?: string
}

export interface NairiChatMeta {
  web_ms: number
  plan_ms: number
  answer_ms: number
}

export type SendNairiChatResult = {
  response: string
  sources: NairiChatSource[]
  meta: NairiChatMeta
}

/**
 * POST /api/nairi-chat – web-grounded 2-pass chat. Returns response + sources + meta.
 */
export async function sendNairiChat(
  messages: NairiMessage[],
  maxTokens: number = 400
): Promise<SendNairiChatResult> {
  const res = await fetchWithTimeout(
    "/api/nairi-chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, max_tokens: maxTokens }),
    },
    CHAT_TIMEOUT_MS + 15_000
  )
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = (data as { error?: string })?.error ?? res.statusText
    throw new Error(detail)
  }
  const d = data as { response?: string; sources?: NairiChatSource[]; meta?: NairiChatMeta }
  if (typeof d?.response !== "string") throw new Error("Invalid response shape")
  const sources = Array.isArray(d.sources) ? d.sources : []
  const meta = d.meta ?? { web_ms: 0, plan_ms: 0, answer_ms: 0 }
  return {
    response: d.response.trim() || "The model returned an empty response. Please try again.",
    sources,
    meta,
  }
}

/**
 * POST /api/nairi/chat with 60s timeout (simple chat, no web grounding).
 * Validates response shape; empty response -> fallback message.
 */
export async function sendChat(
  messages: NairiMessage[],
  maxTokens: number = 200
): Promise<SendChatResult> {
  const res = await fetchWithTimeout(
    "/api/nairi/chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, max_tokens: maxTokens }),
    },
    CHAT_TIMEOUT_MS
  )
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = (data as { error?: string; details?: string })?.error ?? (data as { details?: string })?.details ?? res.statusText
    throw new Error(detail)
  }
  if (!isNairiChatResponse(data)) {
    throw new Error("Invalid response shape")
  }
  const response = (data as NairiChatResponse).response
  const text = typeof response === "string" ? response.trim() : ""
  return {
    response: text || "The model returned an empty response. Please try again or rephrase.",
    latency_sec: (data as NairiChatResponse).latency_sec,
  }
}
