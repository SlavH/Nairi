import { NextRequest, NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { createSharedLink } from "@/lib/features/chat"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { conversationId, expiresInHours } = body as { conversationId?: string; expiresInHours?: number }
  if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const result = await createSharedLink(conversationId, userId, expiresInHours)
  if (!result) return NextResponse.json({ error: "Failed to create shared link" }, { status: 500 })
  return NextResponse.json(result)
}
