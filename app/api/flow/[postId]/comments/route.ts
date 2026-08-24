import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getUserIdForApi } from "@/lib/auth"
import { handleError } from "@/lib/errors/handler"
import { unauthorizedError, validationError } from "@/lib/errors/types"
import { withLogging } from "@/lib/logging/middleware"
import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ postId: string }> }

const commentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
})

export const GET = withLogging(async (_req: NextRequest, ctx: RouteContext) => {
  try {
    const { postId } = await ctx.params
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from("post_comments")
      .select(
        `id, content, created_at, user_id,
         profiles:user_id (id, full_name, avatar_url)`
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(100)

    if (error) return NextResponse.json({ comments: [] })

    const mapped = (comments || []).map((c: Record<string, unknown>) => {
      const profile = c.profiles as { full_name?: string; avatar_url?: string } | null
      return {
        id: String(c.id),
        content: String(c.content),
        created_at: String(c.created_at),
        user_id: String(c.user_id),
        user_name: profile?.full_name || "Anonymous",
        user_avatar: profile?.avatar_url || null,
      }
    })

    return NextResponse.json({ comments: mapped })
  } catch (error) {
    return handleError(error)
  }
})

export const POST = withLogging(async (req: NextRequest, ctx: RouteContext) => {
  try {
    const { postId } = await ctx.params
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"))
    }

    const body = await req.json().catch(() => null)
    const parsed = commentSchema.safeParse(body)
    if (!parsed.success) {
      return handleError(validationError("Comment must be 1-1000 characters"))
    }

    // Post must exist and be visible to the commenter (RLS also enforces)
    const { data: post, error: postError } = await supabase
      .from("feed_posts")
      .select("id")
      .eq("id", postId)
      .single()
    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: userId, content: parsed.data.content })
      .select("id, content, created_at")
      .single()

    if (error) return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .single()

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: userId,
          user_name: profile?.full_name || "Anonymous",
          user_avatar: profile?.avatar_url || null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
})
