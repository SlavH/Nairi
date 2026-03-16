/**
 * POST /api/chat/colab – proxy to Colab backend (POST /chat).
 * Request: { messages: [{ role, content }], max_tokens?: number }
 * Response: { response: string } or { error: string }
 * Uses Colab service layer: timeout, retry, mutex, validation.
 */

import { NextRequest, NextResponse } from "next/server"
import { colabChat } from "@/lib/colab"
import type { ColabMessage } from "@/lib/colab"

function toColabMessages(messages: unknown): ColabMessage[] {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((m): m is { role?: string; content?: string } => m != null && typeof m === "object")
    .map((m) => ({
      role: (m.role === "system" || m.role === "user" || m.role === "assistant" ? m.role : "user") as "system" | "user" | "assistant",
      content: typeof m.content === "string" ? m.content : "",
    }))
    .filter((m) => m.content.length > 0)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const messages = toColabMessages(body.messages)
    const max_tokens = typeof body.max_tokens === "number" ? Math.min(4096, Math.max(1, body.max_tokens)) : 300

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message with content is required" },
        { status: 400 }
      )
    }

    const { text, fromFallback } = await colabChat(messages, { max_tokens })

    return NextResponse.json({ response: text, fromFallback })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: "Colab chat request failed", details: message },
      { status: 503 }
    )
  }
}
