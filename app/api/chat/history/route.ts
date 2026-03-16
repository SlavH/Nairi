/**
 * GET /api/chat/history — list conversations for the current user.
 * Auth required (or BYPASS_AUTH in dev).
 */

import { createClient } from "@/lib/supabase/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, agent_id, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversations: data ?? [] })
}
