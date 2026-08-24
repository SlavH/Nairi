import { NextRequest, NextResponse } from "next/server"

import { getUserIdForApi } from "@/lib/auth"
import { handleError } from "@/lib/errors/handler"
import { unauthorizedError } from "@/lib/errors/types"
import { withLogging } from "@/lib/logging/middleware"
import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ postId: string }> }

export const POST = withLogging(async (req: NextRequest, ctx: RouteContext) => {
  try {
    const { postId } = await ctx.params
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"))
    }

    const { data: post, error: postError } = await supabase
      .from("feed_posts")
      .select("id")
      .eq("id", postId)
      .single()
    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Toggle like
    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase.from("post_likes").delete().eq("id", existing.id)
      if (error) return NextResponse.json({ error: "Failed to unlike" }, { status: 500 })
      return NextResponse.json({ liked: false })
    }

    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId })
    if (error) return NextResponse.json({ error: "Failed to like" }, { status: 500 })
    return NextResponse.json({ liked: true })
  } catch (error) {
    return handleError(error)
  }
})
