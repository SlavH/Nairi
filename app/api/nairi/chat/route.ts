/**
 * POST /api/nairi/chat – proxy to Nairi HF Space POST /chat.
 * Backend has its own SYSTEM_PROMPT; we strip system messages from the request.
 * Timeout 60s.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getNairiChatUrl,
  isNairiConfigured,
  NAIRI_CHAT_TIMEOUT_MS,
} from "@/lib/nairi-api/config"
import type { NairiMessage } from "@/lib/nairi-api/types"
import { isNairiChatResponse } from "@/lib/nairi-api/types"

function toNairiMessages(messages: unknown): NairiMessage[] {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((m): m is { role?: string; content?: string } => m != null && typeof m === "object")
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: typeof m.content === "string" ? m.content : "",
    }))
    .filter((m) => m.content.length > 0)
}

export async function POST(req: NextRequest) {
  if (!isNairiConfigured()) {
    return NextResponse.json({ error: "Nairi backend not configured" }, { status: 503 })
  }
  const url = getNairiChatUrl()
  if (!url) return NextResponse.json({ error: "Nairi chat URL not set" }, { status: 503 })

  let body: { messages?: unknown; max_tokens?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const messages = toNairiMessages(body.messages)
  const max_tokens = typeof body.max_tokens === "number" ? Math.min(4096, Math.max(1, body.max_tokens)) : 200

  if (messages.length === 0) {
    return NextResponse.json({ error: "At least one message required" }, { status: 400 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), NAIRI_CHAT_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, max_tokens }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const data: unknown = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json(
        { error: "Nairi backend error", details: (data as { detail?: string })?.detail ?? res.statusText },
        { status: res.status >= 500 ? 502 : res.status }
      )
    }
    if (!isNairiChatResponse(data)) {
      return NextResponse.json({ error: "Invalid response shape" }, { status: 502 })
    }
    return NextResponse.json({ response: data.response, latency_sec: data.latency_sec })
  } catch (e) {
    clearTimeout(timeoutId)
    const message = e instanceof Error && e.name === "AbortError" ? "Request timed out" : String(e)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
