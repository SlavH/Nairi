"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FlowFeed } from "@/components/flow/flow-feed"
import { FlowStories, FlowStory } from "@/components/flow/flow-stories"
import { Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const mockStories: FlowStory[] = [
  {
    id: "story-1",
    title: "Creative Process",
    steps: [
      { id: "s1-1", type: "prompt", content: "Design a modern dashboard with glassmorphism effects" },
      { id: "s1-2", type: "intermediate", content: "Generated layout structure with flexbox and grid" },
      { id: "s1-3", type: "final", content: "Final dashboard with animated cards and charts" },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "story-2",
    title: "Code Generator",
    steps: [
      { id: "s2-1", type: "prompt", content: "Create a React hook for infinite scroll" },
      { id: "s2-2", type: "intermediate", content: "Drafted useIntersectionObserver logic" },
      { id: "s2-3", type: "final", content: "Optimized hook with cleanup and edge cases" },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "story-3",
    title: "Image Generation",
    steps: [
      { id: "s3-1", type: "prompt", content: "Generate a fantasy landscape with dragons" },
      { id: "s3-2", type: "intermediate", content: "Created sky and mountains base" },
      { id: "s3-3", type: "final", content: "Added dragon silhouettes and lighting" },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "story-4",
    title: "Website Builder",
    steps: [
      { id: "s4-1", type: "prompt", content: "Build a SaaS landing page with pricing table" },
      { id: "s4-2", type: "intermediate", content: "Designed responsive grid layout" },
      { id: "s4-3", type: "final", content: "Added animations and dark mode toggle" },
    ],
    created_at: new Date().toISOString(),
  },
]

export default function FlowPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUserId(user.id)
    }
    fetchUser()
  }, [router])
  
  const handleRemix = (prompt: string) => {
    const encodedPrompt = encodeURIComponent(prompt)
    router.push(`/chat?prompt=${encodedPrompt}`)
  }
  
  const handleCreateNew = () => {
    router.push("/chat")
  }
  
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#e052a0] rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="shrink-0 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Nairi Flow</h1>
              <p className="text-xs text-muted-foreground">Discover AI generations</p>
            </div>
          </div>
          <Button
            onClick={handleCreateNew}
            className="gap-2 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90 border-0 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-white">Flow Stories</h2>
              <span className="text-xs text-muted-foreground">Click to explore</span>
            </div>
            <FlowStories stories={mockStories} />
          </section>
          
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-white">Feed</h2>
              <span className="text-xs text-muted-foreground">Latest generations</span>
            </div>
            <FlowFeed onRemix={handleRemix} />
          </section>
        </div>
      </div>
    </div>
  )
}
