import { createClient } from "@/lib/supabase/server"
import { getUserIdForApi } from "@/lib/auth"
import { BuilderProjectCreateSchema } from "@/lib/schemas/builder"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const RATE_LIMIT_REQUESTS = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export async function GET(req: Request) {
  // Rate limiting
  const clientId = getClientIdentifier(req)
  const rateLimitResult = checkRateLimit(`builder:get:${clientId}`, {
    maxRequests: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  })
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    )
  }

  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
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
  } catch (err) {
    console.error("Builder projects GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Rate limiting
  const clientId = getClientIdentifier(req)
  const rateLimitResult = checkRateLimit(`builder:post:${clientId}`, {
    maxRequests: 5,
    windowMs: RATE_LIMIT_WINDOW_MS,
  })
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    )
  }

  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
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
  } catch (err) {
    console.error("Builder projects POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
