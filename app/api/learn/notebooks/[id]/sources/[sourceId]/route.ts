import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: notebookId, sourceId } = await params
  const { data: notebook } = await supabase
    .from("learn_notebooks")
    .select("id")
    .eq("id", notebookId)
    .eq("user_id", userId)
    .single()

  if (!notebook) {
    return NextResponse.json({ error: "NairiBook not found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("learn_notebook_sources")
    .delete()
    .eq("id", sourceId)
    .eq("notebook_id", notebookId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase
    .from("learn_notebooks")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", notebookId)

  return NextResponse.json({ success: true })
}
