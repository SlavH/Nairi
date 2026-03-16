/**
 * POST /api/nairi-chat – web-grounded Nairi chat.
 * Model decides: if the message is greeting/short chitchat -> single natural reply (no web).
 * Otherwise: SearXNG search -> WEB_CONTEXT -> 2-pass (PLAN → FINAL). Rate limit 10 req/min per IP.
 */

import { NextRequest, NextResponse } from "next/server"
import { searxngSearch, type SearchResult } from "@/lib/searxng"
import { hfEnsureHealthy, hfChat, isHfConfigured, type HfChatMessage } from "@/lib/hf-client"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const MAX_HISTORY = 20
const CLASSIFIER_MAX_TOKENS = 20
const PLAN_MAX_TOKENS = 160
const FINAL_MAX_TOKENS_MAX = 400
const RATE_LIMIT_REQUESTS = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export interface NairiChatSource {
  id: number
  title: string
  url: string
  snippet?: string
}

export interface NairiChatResponseBody {
  response: string
  sources: NairiChatSource[]
  meta: { web_ms: number; plan_ms: number; answer_ms: number }
}

function buildWebContext(results: SearchResult[], searchOk: boolean): string {
  if (!searchOk || results.length === 0) {
    return "WEB_CONTEXT unavailable (search failed)."
  }
  const lines = results.map(
    (r) => `[${r.id}] ${r.title} — ${r.snippet ?? ""} — ${r.url}`
  )
  return `WEB_CONTEXT (use for factual grounding; cite sources as [1],[2],[3]):\n${lines.join("\n")}`
}

function trimHistory(messages: { role: string; content: string }[]): HfChatMessage[] {
  const allowed = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-MAX_HISTORY)
  return allowed.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
}

/** Model decides: reply contains "search" -> use web + 2-pass; otherwise (greeting/short) -> no web. */
function modelWantsWebSearch(classifierReply: string): boolean {
  const t = classifierReply.trim().toLowerCase()
  return t.includes("search") && !t.includes("greeting")
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

  if (!isHfConfigured()) {
    return NextResponse.json({ error: "Nairi HF backend not configured" }, { status: 503 })
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

  const meta = { web_ms: 0, plan_ms: 0, answer_ms: 0 }
  const healthy = await hfEnsureHealthy()
  if (!healthy) {
    return NextResponse.json(
      { error: "Nairi is waking up. Please try again in a moment." },
      { status: 503 }
    )
  }

  const history = trimHistory(messages)

  // Let the model decide: greeting/short chitchat -> no web; else web + 2-pass
  const classifierPrompt = `Reply with exactly one word: GREETING or SEARCH. Does the user's message need web search to answer well, or is it just a greeting or very short chitchat? User message: "${userQuestion}"`
  let classifierReply: string
  try {
    classifierReply = await hfChat([{ role: "user", content: classifierPrompt }], CLASSIFIER_MAX_TOKENS)
  } catch {
    classifierReply = "SEARCH"
  }

  const useWeb = modelWantsWebSearch(classifierReply)

  if (!useWeb) {
    // Single natural reply, no web search
    const requestedMax = typeof body.max_tokens === "number" ? Math.min(4096, Math.max(1, body.max_tokens)) : 400
    const maxTokens = Math.min(FINAL_MAX_TOKENS_MAX, requestedMax)
    const answerStart = Date.now()
    let response: string
    try {
      response = await hfChat(history, maxTokens)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: `Chat failed: ${msg}` }, { status: 502 })
    }
    meta.answer_ms = Date.now() - answerStart
    if (!response.trim()) response = "I couldn't generate a reply this time. Please try again."
    return NextResponse.json({
      response,
      sources: [],
      meta,
    } satisfies NairiChatResponseBody)
  }

  const webStart = Date.now()
  const { results, ok: searchOk } = await searxngSearch(userQuestion)
  meta.web_ms = Date.now() - webStart

  const WEB_CONTEXT = buildWebContext(results, searchOk)
  const sources: NairiChatSource[] = results.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    snippet: r.snippet ?? "",
  }))

  const planStart = Date.now()
  const planUserContent = `Create a short plan to answer using WEB_CONTEXT. Output ONLY:
PLAN:
- ...
- ...
CLARIFY: <empty or 1 short question>

WEB_CONTEXT:
${WEB_CONTEXT}

USER_QUESTION:
${userQuestion}`
  const planMessages: HfChatMessage[] = [
    ...history.slice(0, -1),
    { role: "user" as const, content: planUserContent },
  ]
  let planText: string
  try {
    planText = await hfChat(planMessages, PLAN_MAX_TOKENS)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Plan pass failed: ${msg}` }, { status: 502 })
  }
  meta.plan_ms = Date.now() - planStart

  const requestedMax = typeof body.max_tokens === "number" ? Math.min(4096, Math.max(1, body.max_tokens)) : 400
  const finalMaxTokens = Math.min(FINAL_MAX_TOKENS_MAX, requestedMax)
  const finalUserContent = `Answer the user's question directly. Do NOT output "PLAN:" or a plan again — that was already done. Write only the final answer to the user.

Requirements:
- Concise but complete answer to USER_QUESTION
- Use bullets or steps only when they help the answer
- Cite facts with [1],[2],[3] when using WEB_CONTEXT

WEB_CONTEXT:
${WEB_CONTEXT}

PLAN (already done, do not repeat):
${planText}

USER_QUESTION:
${userQuestion}

Answer (direct reply only):`

  const answerStart = Date.now()
  const finalMessages: HfChatMessage[] = [
    ...history.slice(0, -1),
    { role: "user" as const, content: planUserContent },
    { role: "assistant" as const, content: planText },
    { role: "user" as const, content: finalUserContent },
  ]
  let response: string
  try {
    response = await hfChat(finalMessages, finalMaxTokens)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Answer pass failed: ${msg}` }, { status: 502 })
  }
  meta.answer_ms = Date.now() - answerStart

  if (!response.trim()) {
    response = "I couldn't generate a reply this time. Please try again."
  }

  // If the model echoed a plan instead of an answer, strip leading "PLAN:" line(s)
  let cleaned = response.trim()
  const planLine = /^PLAN\s*:\s*\n?/i
  while (planLine.test(cleaned)) {
    cleaned = cleaned.replace(planLine, "").trim()
  }
  if (cleaned.length > 0) response = cleaned

  return NextResponse.json({
    response,
    sources,
    meta,
  } satisfies NairiChatResponseBody)
}
