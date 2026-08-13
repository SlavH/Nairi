import { NextRequest, NextResponse } from "next/server"

import { getUserIdForApi } from "@/lib/auth"
import { handleError } from "@/lib/errors/handler"
import { unauthorizedError } from "@/lib/errors/types"
import { withLogging } from "@/lib/logging/middleware"
import { createClient } from "@/lib/supabase/server"

interface FlowItem {
  id: string
  prompt: string
  result: string
  type: string
  metadata: {
    likes_count: number
    remix_count: number
    views_count: number
    created_at: string
    user_name: string
    user_avatar: string | null
    title: string | null
  }
}

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase?.auth?.getUser())
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const sort = searchParams.get("sort") || "trending"
    
    let data: FlowItem[] = []
    let hasMore = false
    
    try {
      const { data: posts, error } = await supabase
        .from("feed_posts")
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          post_interactions (id, interaction_type, user_id)
        `)
        .eq("visibility", "public")
        .eq("content_type", "ai_generated")
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit)
      
      if (!error && posts && posts.length > 0) {
        data = posts.map((post) => ({
          id: post.id,
          prompt: post.title || post.content?.substring(0, 100) || "",
          result: post.media_url || post.content || "",
          type: detectType(post.media_url, post.content_type),
          metadata: {
            likes_count: post.likes_count || 0,
            remix_count: post.shares_count || 0,
            views_count: post.comments_count || 0,
            created_at: post.created_at,
            user_name: post.profiles?.full_name || "Anonymous",
            user_avatar: post.profiles?.avatar_url,
            title: post.title,
          },
        }))
        
        hasMore = posts.length === limit
      }
    } catch (dbError) {
      // Database query failed - return an empty collection
    }
    
    const sortedData = [...data]
    switch (sort) {
      case "trending":
        sortedData.sort((a, b) => (b.metadata?.likes_count || 0) - (a.metadata?.likes_count || 0))
        break
      case "new":
        sortedData.sort((a, b) => new Date(b.metadata?.created_at || 0).getTime() - new Date(a.metadata?.created_at || 0).getTime())
        break
      case "most-remixed":
        sortedData.sort((a, b) => (b.metadata?.remix_count || 0) - (a.metadata?.remix_count || 0))
        break
    }
    
    return NextResponse.json({
      items: sortedData,
      hasMore,
      page,
      total: data.length,
    })
  } catch (error) {
    return handleError(error)
  }
})

function detectType(url: string | null, contentType: string): "image" | "website" | "code" | "video" | "simulation" {
  if (!url) return "simulation"
  
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return "image"
  if (/\.(mp4|webm|ogg)$/i.test(url)) return "video"
  if (url.includes("github") || url.includes("codepen") || url.includes("jsfiddle")) return "code"
  if (url.startsWith("http")) return "website"
  
  return "simulation"
}
