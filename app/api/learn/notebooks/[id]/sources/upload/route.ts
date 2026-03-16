/**
 * POST /api/learn/notebooks/[id]/sources/upload
 * Multipart form with "file" (PDF or .txt). Extracts text and adds as source (source_type pdf | file).
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const mod = await import("pdf-parse")
    const fn = (mod as { default?: (buf: Buffer) => Promise<{ text?: string }> }).default ?? (mod as (buf: Buffer) => Promise<{ text?: string }>)
    const data = await fn(buffer)
    return (data?.text ?? "").trim().slice(0, 500_000)
  } catch (e) {
    throw new Error("PDF parsing failed. Ensure pdf-parse is installed (npm install pdf-parse).")
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: notebookId } = await params
  let content: string
  let title: string
  let sourceType: "pdf" | "file"

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const titleParam = formData.get("title") as string | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 })
    }
    const name = (file.name || "").toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())
    title = (titleParam && String(titleParam).trim()) || file.name || "Uploaded file"

    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      content = await extractTextFromPdf(buffer)
      sourceType = "pdf"
    } else if (name.endsWith(".txt") || file.type?.startsWith("text/")) {
      content = buffer.toString("utf-8").slice(0, 500_000)
      sourceType = "file"
    } else {
      return NextResponse.json(
        { error: "Only PDF and text files are supported" },
        { status: 400 }
      )
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to process file"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (!content || content.length < 10) {
    return NextResponse.json(
      { error: "Could not extract enough text from the file" },
      { status: 400 }
    )
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

  const { data: source, error } = await supabase
    .from("learn_notebook_sources")
    .insert({
      notebook_id: notebookId,
      title: title.slice(0, 500),
      content: content.slice(0, 500_000),
      source_type: sourceType,
      url: null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase
    .from("learn_notebooks")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", notebookId)

  return NextResponse.json({ source })
}
