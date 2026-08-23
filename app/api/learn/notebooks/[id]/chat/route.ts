import { NextResponse, type NextRequest } from "next/server"

import { REQUIRE_CITATIONS_INSTRUCTION } from "@/lib/ai/citations"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { getUserIdForApi } from "@/lib/auth"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { assertSameOrigin } from "@/lib/security/request-validator"
import { createClient } from "@/lib/supabase/server"

// F24: bounded context budget instead of every source × 80k chars.
const MAX_CONTEXT_SOURCES = 10
const PER_SOURCE_CHARS = 20_000
const TOTAL_CONTEXT_CHARS = 80_000

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originGuard = assertSameOrigin(req)
  if (originGuard) return originGuard

  const clientId = getClientIdentifier(req)
  if (!checkRateLimit(`learn-chat:${clientId}`, { maxRequests: 10, windowMs: 60_000 }).success) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const supabase = await createClient()
  const userId = await getUserIdForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: notebookId } = await params
  const body = await req.json().catch(() => ({}))
  const message = (body.message as string)?.trim()
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 })
  }
  const { data: notebook } = await supabase
    .from("learn_notebooks")
    .select("id")
    .eq("id", notebookId)
    .eq("user_id", userId)
    .single()

  if (!notebook) {
    return NextResponse.json({ error: "NairiBook not found" }, { status: 404 })
  }

  const { data: sources } = await supabase
    .from("learn_notebook_sources")
    .select("id, title, content")
    .eq("notebook_id", notebookId)
    .order("created_at", { ascending: true })

  if (!sources?.length) {
    return NextResponse.json({
      error: "Add at least one source to this NairiBook before asking questions.",
    }, { status: 400 })
  }

  // Include at most MAX_CONTEXT_SOURCES sources and stop once the total
  // character budget is spent (F24).
  const selectedSources = sources.slice(0, MAX_CONTEXT_SOURCES)
  let usedChars = 0
  const contextBlocks: string[] = []
  for (const [i, s] of selectedSources.entries()) {
    if (usedChars >= TOTAL_CONTEXT_CHARS) break
    const room = Math.min(PER_SOURCE_CHARS, TOTAL_CONTEXT_CHARS - usedChars)
    const chunk = (s.content ?? "").slice(0, room)
    usedChars += chunk.length
    contextBlocks.push(`--- Source [${i + 1}]: ${s.title} ---\n${chunk}`)
  }
  const context = contextBlocks.join("\n\n")

  const systemPrompt = `You are a helpful research assistant. You answer questions ONLY using the provided sources below. Base every claim on a specific source. Cite sources using [1], [2], etc. corresponding to the source numbers. If the answer cannot be found in the sources, say so clearly. Do not make up information.
${REQUIRE_CITATIONS_INSTRUCTION}

SOURCES:
${context}`

  try {
    const { text } = await generateWithFallback({
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
      temperature: 0.3,
      maxOutputTokens: 2048,
      fast: false,
    })

    return NextResponse.json({
      answer: text,
      sources: selectedSources.map((s) => ({ id: s.id, title: s.title })),
    })
  } catch (e) {
    console.error("NairiBook chat error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to get answer" },
      { status: 500 }
    )
  }
}
