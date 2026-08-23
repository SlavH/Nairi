import { NextResponse } from "next/server"

import { getUserIdForApi } from "@/lib/auth"
import { BuilderProjectUpdateSchema, getProjectFilesSize, MAX_PROJECT_BYTES } from "@/lib/schemas/builder"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const userId = await getUserIdForApi(() => supabase.auth.getUser())
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
  const userId = await getUserIdForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = BuilderProjectUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  if (parsed.data.files && getProjectFilesSize(parsed.data.files) > MAX_PROJECT_BYTES) {
    return NextResponse.json({ error: "Project exceeds the 500KB size limit" }, { status: 413 })
  }
  const now = new Date().toISOString()
  const updates: { name?: string; files?: unknown[]; versions?: unknown[]; updated_at?: string } = {
    updated_at: now,
  }
  if (typeof parsed.data.name === "string" && parsed.data.name.trim()) {
    updates.name = parsed.data.name.trim()
  }
  if (Array.isArray(parsed.data.files)) {
    // Snapshot only when the file payload actually changed (F17): fetching
    // current files lets us compare instead of appending a version on every
    // autosave tick.
    const { data: current } = await supabase
      .from("builder_projects")
      .select("versions, files")
      .eq("id", id)
      .eq("user_id", userId)
      .single()
    const prevVersions = Array.isArray(current?.versions) ? current.versions : []
    const prevFilesJson = JSON.stringify(current?.files ?? null)
    const nextFilesJson = JSON.stringify(parsed.data.files)
    updates.files = parsed.data.files
    if (nextFilesJson !== prevFilesJson) {
      const newVersion = {
        id: crypto.randomUUID(),
        name: `Save ${new Date().toLocaleString()}`,
        description: "",
        files: parsed.data.files,
        createdAt: now,
      }
      updates.versions = [...prevVersions, newVersion].slice(-30)
    }
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
  const userId = await getUserIdForApi(() => supabase.auth.getUser())
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
