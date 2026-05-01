/**
 * POST /api/nairi-chat — web-grounded Nairi chat.
 * Routes through NAIRI_AI_BASE_URL (GPU) for all AI inference.
 * Model decides: greeting/short chitchat → single reply; else → web search + 2-pass (PLAN → FINAL).
 */

import { NextRequest, NextResponse } from "next/server"
import { searxngSearch, type SearchResult } from "@/lib/searxng"
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

function buildWebContext(results: SearchResult[], searchOk: boolean): string {
  if (!searchOk || results.length === 0) {
    return "WEB_CONTEXT unavailable (search failed)."
  }
  const lines = results.map(
    (r) => `[${r.id}] ${r.title} — ${r.snippet ?? ""} — ${r.url}`
  )
  return `WEB_CONTEXT (use for factual grounding; cite sources as [1],[2],[3]):\n${lines.join("\n")}`
}

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

  // Classifier: greeting vs search — using GPU backend
  const classifierPrompt = `Reply with exactly one word: GREETING or SEARCH. Does the user's message need web search to answer well, or is it just a greeting or very short chitchat? User message: "${userQuestion}"`
  let classifierReply: string
  try {
    const { text } = await generateWithFallback({
      system: "Reply with exactly one word: GREETING or SEARCH.",
      prompt: classifierPrompt,
      temperature: 0,
      maxOutputTokens: 5,
      fast: true,
    })
    classifierReply = text.trim()
  } catch {
    classifierReply = "SEARCH"
  }

  const useWeb = modelWantsWebSearch(classifierReply)
  const requestedMax = typeof body.max_tokens === "number" ? Math.min(4096, Math.max(1, body.max_tokens)) : 400

  if (!useWeb) {
    // Single natural reply, no web search — GPU backend
    const answerStart = Date.now()
    let response: string
    try {
      const historyText = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-MAX_HISTORY)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n")

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
    if (!response.trim()) response = "I couldn't generate a reply this time. Please try again."
    return NextResponse.json({
      response,
      sources: [],
      meta,
    })
  }

  // Web search path
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

  // Plan pass — GPU backend
  const planStart = Date.now()
  const planPrompt = `Create a short plan to answer using WEB_CONTEXT. Output ONLY:
PLAN:
- ...
- ...
CLARIFY: <empty or 1 short question>

WEB_CONTEXT:
${WEB_CONTEXT}

USER_QUESTION:
${userQuestion}`

  let planText: string
  try {
    const { text } = await generateWithFallback({
      system: "You are a research assistant. Create a brief plan for answering the user's question using the provided web context.",
      prompt: planPrompt,
      temperature: 0.3,
      maxOutputTokens: 160,
    })
    planText = text
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Plan pass failed: ${msg}` }, { status: 502 })
  }
  meta.plan_ms = Date.now() - planStart

  // Final answer pass — GPU backend
  const finalMaxTokens = Math.min(400, requestedMax)
  const finalPrompt = `Answer the user's question directly. Do NOT output "PLAN:" or a plan again — that was already done. Write only the final answer to the user.

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
  let response: string
  try {
    const { text } = await generateWithFallback({
      system: "You are Nairi, a helpful AI assistant. Answer questions using the provided web context. Cite sources with [1], [2], etc.",
      prompt: finalPrompt,
      temperature: 0.7,
      maxOutputTokens: finalMaxTokens,
    })
    response = text
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Answer pass failed: ${msg}` }, { status: 502 })
  }
  meta.answer_ms = Date.now() - answerStart

  if (!response.trim()) {
    response = "I couldn't generate a reply this time. Please try again."
  }

  // Strip leading PLAN: if model echoed it
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
  })
}
