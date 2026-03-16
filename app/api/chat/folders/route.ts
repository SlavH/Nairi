import { NextRequest, NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getConversationFolders, createConversationFolder } from "@/lib/features/chat"

export async function GET() {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const folders = await getConversationFolders(userId)
  return NextResponse.json({ folders })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const name = body.name ?? "New folder"
  const id = await createConversationFolder(userId, name)
  if (!id) return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  return NextResponse.json({ id, name })
}
