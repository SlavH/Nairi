import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"

export async function GET() {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data, error } = await supabase
    .from("learn_notebooks")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ notebooks: data ?? [] })
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const title = (body.title as string)?.trim() || "Untitled NairiBook"
    const { data, error } = await supabase
      .from("learn_notebooks")
      .insert({ user_id: userId, title })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ notebook: data })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create notebook"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
