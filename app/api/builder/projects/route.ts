import { createClient } from "@/lib/supabase/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { BuilderProjectCreateSchema } from "@/lib/schemas/builder"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data, error } = await supabase
    .from("builder_projects")
    .select("id, name, files, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
  if (error) {
    console.error("Builder projects list error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = BuilderProjectCreateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const name = parsed.data.name?.trim() || "Untitled project"
  const files = parsed.data.files
  const { data, error } = await supabase
    .from("builder_projects")
    .insert({ user_id: userId, name, files })
    .select("id, name, files, created_at, updated_at")
    .single()
  if (error) {
    console.error("Builder project create error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
