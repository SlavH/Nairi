import { createClient } from "@/lib/supabase/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data, error } = await supabase
    .from("builder_projects")
    .select("id, name, files, versions, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single()
  if (error || !data) {
    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    console.error("Builder project get error:", error)
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 500 })
  }
  const versions = Array.isArray(data.versions) ? data.versions : []
  return NextResponse.json({ ...data, versions })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let body: { name?: string; files?: unknown[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const now = new Date().toISOString()
  const updates: { name?: string; files?: unknown[]; versions?: unknown[]; updated_at?: string } = {
    updated_at: now,
  }
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim()
  if (Array.isArray(body.files)) {
    updates.files = body.files
    // Append version snapshot when files are saved (cap at 30)
    const { data: current } = await supabase
      .from("builder_projects")
      .select("versions")
      .eq("id", id)
      .eq("user_id", userId)
      .single()
    const prevVersions = Array.isArray(current?.versions) ? current.versions : []
    const newVersion = {
      id: crypto.randomUUID(),
      name: `Save ${new Date().toLocaleString()}`,
      description: "",
      files: body.files,
      createdAt: now,
    }
    updates.versions = [...prevVersions, newVersion].slice(-30)
  }
  const { data, error } = await supabase
    .from("builder_projects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, name, files, versions, created_at, updated_at")
    .single()
  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    console.error("Builder project update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const versions = Array.isArray(data?.versions) ? data.versions : []
  return NextResponse.json({ ...data, versions })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { error } = await supabase
    .from("builder_projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
  if (error) {
    console.error("Builder project delete error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
