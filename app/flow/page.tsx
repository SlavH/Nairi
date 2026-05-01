"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FlowFeed } from "@/components/flow/flow-feed"
import { FlowStories, FlowStory } from "@/components/flow/flow-stories"
import { Sparkles, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FlowPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [stories, setStories] = useState<FlowStory[]>([])
  const [loading, setLoading] = useState(true)
  
  const fetchStories = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setUserId(user.id)

    let storiesData: any[] = []
    try {
      const { data } = await supabase
        .from('flow_stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      storiesData = data || []
    } catch {
      // Table might not exist yet
    }

    const formatted: FlowStory[] = storiesData.map((s: any) => ({
      id: s.id,
      title: s.title || 'Flow Story',
      steps: s.steps || [],
      created_at: s.created_at,
    }))

    setStories(formatted)
    setLoading(false)
  }
  
  useEffect(() => {
    fetchStories()
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
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchStories} className="bg-transparent border-white/20 text-white hover:bg-white/10" aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={handleCreateNew}
              className="gap-2 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90 border-0 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          {stories.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-white">Flow Stories</h2>
                <span className="text-xs text-muted-foreground">Click to explore</span>
              </div>
              <FlowStories stories={stories} />
            </section>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white/20 border-t-[#e052a0] rounded-full animate-spin" />
            </div>
          ) : (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-white">Feed</h2>
                <span className="text-xs text-muted-foreground">Latest generations</span>
              </div>
              <FlowFeed onRemix={handleRemix} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
