import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getUserIdForApi } from "@/lib/auth"
import { handleError } from "@/lib/errors/handler"
import { unauthorizedError, validationError } from "@/lib/errors/types"
import { withLogging } from "@/lib/logging/middleware"
import { createClient } from "@/lib/supabase/server"

const followSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
})

// GET: ids the current user follows
export const GET = withLogging(async () => {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"))
    }

    const { data } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId)

    return NextResponse.json({ following: (data || []).map((f) => f.following_id) })
  } catch (error) {
    return handleError(error)
  }
})

// POST: toggle follow
export const POST = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"))
    }

    const body = await req.json().catch(() => null)
    const parsed = followSchema.safeParse(body)
    if (!parsed.success) {
      return handleError(validationError(parsed.error.issues[0]?.message || "Invalid payload"))
    }
    const targetId = parsed.data.userId

    if (targetId === userId) {
      return handleError(validationError("You cannot follow yourself"))
    }

    // Target user must exist
    const { data: target } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetId)
      .single()
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", targetId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase.from("user_follows").delete().eq("id", existing.id)
      if (error) return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 })
      return NextResponse.json({ following: false })
    }

    const { error } = await supabase
      .from("user_follows")
      .insert({ follower_id: userId, following_id: targetId })
    if (error) return NextResponse.json({ error: "Failed to follow" }, { status: 500 })
    return NextResponse.json({ following: true })
  } catch (error) {
    return handleError(error)
  }
})
