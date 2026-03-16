import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { REQUIRE_CITATIONS_INSTRUCTION } from "@/lib/ai/citations"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
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

  const contextBlocks = sources.map(
    (s, i) =>
      `--- Source [${i + 1}]: ${s.title} ---\n${(s.content ?? "").slice(0, 80000)}`
  )
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
      sources: sources.map((s) => ({ id: s.id, title: s.title })),
    })
  } catch (e) {
    console.error("NairiBook chat error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to get answer" },
      { status: 500 }
    )
  }
}
