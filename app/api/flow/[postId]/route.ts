import { NextRequest, NextResponse } from "next/server"

import { getUserIdForApi } from "@/lib/auth"
import { handleError } from "@/lib/errors/handler"
import { unauthorizedError } from "@/lib/errors/types"
import { withLogging } from "@/lib/logging/middleware"
import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ postId: string }> }

export const DELETE = withLogging(async (_req: NextRequest, ctx: RouteContext) => {
  try {
    const { postId } = await ctx.params
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"))
    }

    // RLS "feed_posts_own" restricts the delete to the author
    const { error, count } = await supabase
      .from("feed_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId)

    if (error) return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
    if (!count) return NextResponse.json({ error: "Post not found or not yours" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
})
