import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch user's activity logs
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const category = url.searchParams.get("category")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    let query = supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq("category", category)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error("Activity logs fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from("activity_logs")
      .select("category")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const categoryCounts = stats?.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      stats: {
        weeklyTotal: stats?.length || 0,
        byCategory: categoryCounts
      }
    })

  } catch (error) {
    console.error("Activity API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Log a new activity
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, category, description, metadata, riskLevel } = await req.json()

    if (!action || !category) {
      return NextResponse.json({ error: "Action and category are required" }, { status: 400 })
    }

    const validCategories = ["auth", "creation", "chat", "marketplace", "settings", "security"]
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const { data: log, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        action,
        category,
        description,
        metadata: metadata || {},
        risk_level: riskLevel || "low"
      })
      .select()
      .single()

    if (error) {
      console.error("Activity log insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, log })

  } catch (error) {
    console.error("Activity POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
