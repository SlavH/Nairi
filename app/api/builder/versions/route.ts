import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getBuilderVersions, saveBuilderSnapshot } from "@/lib/features/builder"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const versions = await getBuilderVersions(projectId, userId)
  return NextResponse.json({ versions })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { projectId, content } = body as { projectId?: string; content?: string }
  if (!projectId || !content) return NextResponse.json({ error: "Missing projectId or content" }, { status: 400 })
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const ok = await saveBuilderSnapshot(projectId, content, userId)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Failed to save snapshot" }, { status: 500 })
}
