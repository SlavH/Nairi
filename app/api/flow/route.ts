import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getUserIdForApi } from "@/lib/auth"
import { handleError } from "@/lib/errors/handler"
import { unauthorizedError, validationError } from "@/lib/errors/types"
import { withLogging } from "@/lib/logging/middleware"
import { createClient } from "@/lib/supabase/server"

export interface FlowItem {
  id: string
  content: string
  title: string | null
  media_url: string | null
  media_type: "image" | "video" | "code" | "website" | "simulation" | "text"
  tags: string[]
  created_at: string
  user_id: string
  user_name: string
  user_avatar: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  is_liked: boolean
  is_own: boolean
}

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  title: z.string().trim().max(120).optional().nullable(),
  media_url: z.string().url().max(2048).optional().nullable(),
  media_type: z.enum(["image", "video", "code", "website", "simulation"]).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).optional(),
})

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase?.auth?.getUser())

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") || "12")))
    const sort = searchParams.get("sort") || "foryou"
    const offset = (page - 1) * limit

    // Who the current user follows (for "following" sort + follow buttons)
    let followingIds: string[] = []
    if (userId) {
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId)
      followingIds = (follows || []).map((f) => f.following_id)
    }

    let query = supabase
      .from("feed_posts")
      .select(
        `id, user_id, content, title, media_url, media_type, tags, visibility,
         likes_count, comments_count, shares_count, created_at,
         profiles:user_id (id, full_name, avatar_url)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (!userId) {
      query = query.eq("visibility", "public")
    }

    const { data: posts, error, count } = await query
    if (error) {
      return NextResponse.json({ items: [], hasMore: false, page, total: 0, following: followingIds })
    }

    let likedPostIds = new Set<string>()
    if (userId && posts && posts.length > 0) {
      const ids = posts.map((p) => p.id)
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", ids)
      likedPostIds = new Set((likes || []).map((l) => l.post_id))
    }

    let items: FlowItem[] = (posts || []).map((post: Record<string, unknown>) => {
      const profile = post.profiles as { id?: string; full_name?: string; avatar_url?: string } | null
      const p = post as Record<string, string>
      return {
        id: String(post.id),
        content: p.content || "",
        title: p.title || null,
        media_url: p.media_url || null,
        media_type: normalizeType(p.media_url, p.media_type),
        tags: Array.isArray(post.tags) ? (post.tags as string[]) : [],
        created_at: p.created_at,
        user_id: String(post.user_id),
        user_name: profile?.full_name || "Anonymous",
        user_avatar: profile?.avatar_url || null,
        likes_count: Number(p.likes_count) || 0,
        comments_count: Number(p.comments_count) || 0,
        shares_count: Number(p.shares_count) || 0,
        is_liked: likedPostIds.has(String(post.id)),
        is_own: userId === String(post.user_id),
      }
    })

    switch (sort) {
      case "following":
        items = items.filter((i) => followingIds.includes(i.user_id))
        break
      case "trending":
        items.sort((a, b) => b.likes_count + b.comments_count - (a.likes_count + a.comments_count))
        break
      default:
        break
    }

    return NextResponse.json({
      items,
      hasMore: (count ?? 0) > offset + items.length,
      page,
      total: count ?? items.length,
      following: followingIds,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"))
    }

    const body = await req.json().catch(() => null)
    const parsed = createPostSchema.safeParse(body)
    if (!parsed.success) {
      return handleError(validationError(parsed.error.issues[0]?.message || "Invalid post payload"))
    }

    const { content, title, media_url, media_type, tags } = parsed.data

    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      content,
      visibility: "public",
      tags: tags || [],
    }
    if (title) insertPayload.title = title
    if (media_url) {
      insertPayload.media_url = media_url
      insertPayload.media_type = media_type || detectMediaType(media_url)
    }

    const { data: post, error } = await supabase
      .from("feed_posts")
      .insert(insertPayload)
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ success: true, postId: post.id }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
})

function detectMediaType(url: string): FlowItem["media_type"] {
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) return "image"
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return "video"
  if (/github|codepen|jsfiddle/i.test(url)) return "code"
  return "website"
}

function normalizeType(url: string | null | undefined, mediaType: string | null | undefined): FlowItem["media_type"] {
  if (mediaType === "image" || mediaType === "video" || mediaType === "code" ||
      mediaType === "website" || mediaType === "simulation") return mediaType
  if (mediaType === "text") return "text"
  if (!url) return "text"
  return detectMediaType(url)
}
