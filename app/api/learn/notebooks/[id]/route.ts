import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { data: notebook, error: notebookError } = await supabase
    .from("learn_notebooks")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (notebookError || !notebook) {
    return NextResponse.json({ error: "NairiBook not found" }, { status: 404 })
  }

  const { data: sources } = await supabase
    .from("learn_notebook_sources")
    .select("id, title, content, source_type, url, created_at")
    .eq("notebook_id", id)
    .order("created_at", { ascending: true })

  return NextResponse.json({ notebook: { ...notebook, sources: sources ?? [] } })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const title = (body.title as string)?.trim()

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 })
  }
  const { data, error } = await supabase
    .from("learn_notebooks")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ notebook: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { error } = await supabase
    .from("learn_notebooks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
