import { NextRequest, NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { updateConversationFolder, deleteConversationFolder } from "@/lib/features/chat"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params
  if (!folderId) return NextResponse.json({ error: "Missing folderId" }, { status: 400 })
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const name = body.name ?? ""
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name (non-empty string) required" }, { status: 400 })
  }
  const ok = await updateConversationFolder(folderId, userId, name.trim())
  if (!ok) return NextResponse.json({ error: "Failed to update folder" }, { status: 500 })
  return NextResponse.json({ ok: true, name: name.trim() })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params
  if (!folderId) return NextResponse.json({ error: "Missing folderId" }, { status: 400 })
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const ok = await deleteConversationFolder(folderId, userId)
  if (!ok) return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
