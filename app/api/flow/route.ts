import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleError } from "@/lib/errors/handler"
import { unauthorizedError } from "@/lib/errors/types"
import { withLogging } from "@/lib/logging/middleware"
import { getUserIdOrBypassForApi } from "@/lib/auth"

const mockFlowData = [
  {
    id: "1",
    prompt: "Create a futuristic neon cityscape at sunset with flying cars",
    result: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800",
    type: "image",
    metadata: {
      likes_count: 245,
      remix_count: 89,
      views_count: 12453,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      user_name: "CreativeAI",
      user_avatar: null,
      title: "Neon Dreams",
    },
  },
  {
    id: "2",
    prompt: "Build a responsive landing page for a fintech startup",
    result: "https://example.com",
    type: "website",
    metadata: {
      likes_count: 189,
      remix_count: 156,
      views_count: 8934,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      user_name: "DevMaster",
      user_avatar: null,
      title: "FinTech Landing",
    },
  },
  {
    id: "3",
    prompt: "Generate a React component for a glassmorphic button with hover effects",
    result: `const GlassButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
  >
    {children}
  </button>
);`,
    type: "code",
    metadata: {
      likes_count: 523,
      remix_count: 312,
      views_count: 15678,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      user_name: "CodeWizard",
      user_avatar: null,
      title: "Glassmorphic Button",
    },
  },
  {
    id: "4",
    prompt: "Create an animated particle system with mouse interaction",
    result: "https://example.com/particle",
    type: "simulation",
    metadata: {
      likes_count: 432,
      remix_count: 278,
      views_count: 19234,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      user_name: "PhysicsDev",
      user_avatar: null,
      title: "Interactive Particles",
    },
  },
  {
    id: "5",
    prompt: "Generate a cinematic drone shot over mountain ranges",
    result: "https://example.com/video1.mp4",
    type: "video",
    metadata: {
      likes_count: 367,
      remix_count: 145,
      views_count: 11234,
      created_at: new Date(Date.now() - 18000000).toISOString(),
      user_name: "VideoPro",
      user_avatar: null,
      title: "Mountain Aerial",
    },
  },
  {
    id: "6",
    prompt: "Design a minimalist portfolio website with dark theme",
    result: "https://example.com/portfolio",
    type: "website",
    metadata: {
      likes_count: 298,
      remix_count: 201,
      views_count: 14567,
      created_at: new Date(Date.now() - 21600000).toISOString(),
      user_name: "DesignerX",
      user_avatar: null,
      title: "Dark Portfolio",
    },
  },
  {
    id: "7",
    prompt: "Create a portrait of a cyberpunk character with neon lighting",
    result: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    type: "image",
    metadata: {
      likes_count: 512,
      remix_count: 345,
      views_count: 21345,
      created_at: new Date(Date.now() - 25200000).toISOString(),
      user_name: "ArtMaster",
      user_avatar: null,
      title: "Cyberpunk Portrait",
    },
  },
  {
    id: "8",
    prompt: "Write a TypeScript utility function for deep object cloning",
    result: `function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}`,
    type: "code",
    metadata: {
      likes_count: 678,
      remix_count: 423,
      views_count: 27890,
      created_at: new Date(Date.now() - 28800000).toISOString(),
      user_name: "TypeScriptNinja",
      user_avatar: null,
      title: "Deep Clone Utility",
    },
  },
]

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase?.auth?.getUser())
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const sort = searchParams.get("sort") || "trending"
    
    const supabase = await createClient()
    
    let data: typeof mockFlowData = []
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
      console.log("Database not available, using mock data")
    }
    
    if (data.length === 0) {
      const start = (page - 1) * limit
      const end = start + limit
      data = mockFlowData.slice(start, end) as typeof mockFlowData
      hasMore = end < mockFlowData.length
    }
    
    let sortedData = [...data]
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
