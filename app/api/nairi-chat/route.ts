/**
 * POST /api/nairi-chat — web-grounded Nairi chat.
 * Simplified: always use direct answer mode (no plan/web search).
 */
import { NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const MAX_HISTORY = 20
const RATE_LIMIT_REQUESTS = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export interface NairiChatSource {
  id: number
  title: string
  url: string
  snippet?: string
}

export async function POST(req: NextRequest) {
  const ip = getClientIdentifier(req)
  const limit = checkRateLimit(ip, {
    maxRequests: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  })
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    )
  }

  let body: { messages?: Array<{ role?: string; content?: string }>; max_tokens?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const lastUser = [...messages].reverse().find((m) => m?.role === "user")
  const userQuestion = typeof lastUser?.content === "string" ? lastUser.content.trim() : ""
  if (!userQuestion) {
    return NextResponse.json({ error: "No user message found" }, { status: 400 })
  }

  const meta: { web_ms: number; plan_ms: number; answer_ms: number } = { web_ms: 0, plan_ms: 0, answer_ms: 0 }

  // Simple direct answer — no web search, no plan pass
  const answerStart = Date.now()
  let response: string
  try {
    const historyText = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-MAX_HISTORY)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")

    const requestedMax = typeof body.max_tokens === "number" ? Math.min(4096, Math.max(1, body.max_tokens)) : 400

    const { text } = await generateWithFallback({
      system: "You are Nairi, a helpful and knowledgeable AI assistant. Be concise and natural.",
      prompt: historyText ? `${historyText}\nassistant: ` : userQuestion,
      temperature: 0.7,
      maxOutputTokens: requestedMax,
    })
    response = text
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Chat failed: ${msg}` }, { status: 502 })
  }
  meta.answer_ms = Date.now() - answerStart

  if (!response.trim()) {
    response = "I couldn't generate a reply this time. Please try again."
  }

  return NextResponse.json({
    response,
    sources: [],
    meta,
  })
}
