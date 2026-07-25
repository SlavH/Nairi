import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserIdForApi } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single()
      if (error || !data) return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
      return NextResponse.json(data)
    }

    const { data, error } = await supabase
      .from("workflows")
      .select("id, name, description, status, version, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { data, error } = await supabase
      .from("workflows")
      .insert({
        user_id: userId,
        name: body.name || "Untitled Workflow",
        description: body.description || "",
        nodes: body.nodes ?? [],
        edges: body.edges ?? [],
        variables: body.variables ?? [],
        settings: body.settings ?? {},
        triggers: body.triggers ?? [],
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 })

    const { data, error } = await supabase
      .from("workflows")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 })

    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
