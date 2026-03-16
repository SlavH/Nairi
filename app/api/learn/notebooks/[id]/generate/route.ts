/**
 * POST /api/learn/notebooks/[id]/generate
 * NotebookLM-style generations: overview, study_guide, faq, briefing.
 * Body: { type: "overview" | "study_guide" | "faq" | "briefing" }
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { generateWithFallback } from "@/lib/ai/groq-direct"

const GENERATION_TYPES = [
  "overview",
  "study_guide",
  "faq",
  "briefing",
  "outline",
  "key_themes",
  "podcast_script",
  "action_items",
] as const

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: notebookId } = await params
  const body = await req.json().catch(() => ({}))
  const type = body.type as string

  if (!GENERATION_TYPES.includes(type as (typeof GENERATION_TYPES)[number])) {
    return NextResponse.json(
      { error: `type must be one of: ${GENERATION_TYPES.join(", ")}` },
      { status: 400 }
    )
  }

  const { data: notebook } = await supabase
    .from("learn_notebooks")
    .select("id")
    .eq("id", notebookId)
    .eq("user_id", userId)
    .single()

  if (!notebook) return NextResponse.json({ error: "NairiBook not found" }, { status: 404 })

  const { data: sources } = await supabase
    .from("learn_notebook_sources")
    .select("id, title, content")
    .eq("notebook_id", notebookId)
    .order("created_at", { ascending: true })

  if (!sources?.length) {
    return NextResponse.json(
      { error: "Add at least one source before generating." },
      { status: 400 }
    )
  }

  const contextBlocks = sources.map(
    (s, i) => `--- Source [${i + 1}]: ${s.title} ---\n${(s.content ?? "").slice(0, 60000)}`
  )
  const context = contextBlocks.join("\n\n")

  const prompts: Record<string, { system: string; user: string }> = {
    overview: {
      system: `You are a concise summarizer. Based ONLY on the provided sources, write a clear 2–4 paragraph overview. Do not add information that is not in the sources. Use neutral, informative language.`,
      user: `Write an overview of the following sources.\n\nSOURCES:\n${context}`,
    },
    study_guide: {
      system: `You are a study guide writer. Using ONLY the provided sources, create a structured study guide with sections, key points, and optional review questions. Do not invent facts. Cite source numbers [1], [2] where relevant.`,
      user: `Create a study guide from these sources.\n\nSOURCES:\n${context}`,
    },
    faq: {
      system: `You are an FAQ writer. Based ONLY on the provided sources, generate 8–15 frequently asked questions with concise, accurate answers. Use only information from the sources. Format as Q: ... A: ...`,
      user: `Generate an FAQ from these sources.\n\nSOURCES:\n${context}`,
    },
    briefing: {
      system: `You are a briefing writer. Using ONLY the provided sources, write a one-page executive briefing: key takeaways, main points, and implications. Be concise and factual. Do not add external information.`,
      user: `Write an executive briefing from these sources.\n\nSOURCES:\n${context}`,
    },
    outline: {
      system: `You are an outline writer. Based ONLY on the provided sources, produce a clear hierarchical outline (headings and subheadings) that captures the structure and main ideas. Use I, A, 1, a style or bullet points. Do not add content not in the sources.`,
      user: `Create a detailed outline from these sources.\n\nSOURCES:\n${context}`,
    },
    key_themes: {
      system: `You are an analyst. Using ONLY the provided sources, identify and explain 5–10 key themes or concepts. For each theme give a short title and 2–4 sentences. Do not invent information.`,
      user: `Extract key themes from these sources.\n\nSOURCES:\n${context}`,
    },
    podcast_script: {
      system: `You are a podcast script writer. Using ONLY the provided sources, write a 2–4 minute podcast script (host narration) that summarizes and explains the material in an engaging, conversational way. Include a short intro and outro. Do not add facts not in the sources.`,
      user: `Turn these sources into a podcast script.\n\nSOURCES:\n${context}`,
    },
    action_items: {
      system: `You are an action-items extractor. Based ONLY on the provided sources, list concrete action items, next steps, or recommendations that appear in or follow from the material. Use bullet points. Be specific. Do not invent items.`,
      user: `Extract action items and next steps from these sources.\n\nSOURCES:\n${context}`,
    },
  }

  const { system, user } = prompts[type]
  try {
    const { text } = await generateWithFallback({
      system,
      messages: [{ role: "user", content: user }],
      temperature: 0.4,
      maxOutputTokens: 4096,
      fast: false,
    })
    return NextResponse.json({ type, content: text })
  } catch (e) {
    console.error("NairiBook generate error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    )
  }
}
