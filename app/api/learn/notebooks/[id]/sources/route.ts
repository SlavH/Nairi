import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { fetchUrlAndExtractText } from "@/lib/learn/url-research"

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
  let title = (body.title as string)?.trim() || ""
  let content = (body.content as string)?.trim() ?? ""
  const source_type = body.source_type === "url" ? "url" : "paste"
  const url = source_type === "url" ? (body.url as string)?.trim() || null : null

  if (source_type === "url" && url) {
    try {
      const { text, title: pageTitle } = await fetchUrlAndExtractText(url)
      content = text
      if (!title) title = pageTitle || url.slice(0, 200)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to research URL"
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (!content) {
    return NextResponse.json(
      { error: source_type === "url" ? "Enter a valid URL to research" : "content required" },
      { status: 400 }
    )
  }
  if (!title) title = "Untitled source"

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
      source_type,
      url: url ?? undefined,
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
