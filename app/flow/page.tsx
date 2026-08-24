"use client"

import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { FlowFeed } from "@/components/flow/flow-feed"
import { FlowStories, FlowStory } from "@/components/flow/flow-stories"
import { createClient } from "@/lib/supabase/client"

export default function FlowPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [stories, setStories] = useState<FlowStory[]>([])
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      if (!mounted) return
      setUserId(user.id)
      setAuthLoading(false)

      try {
        const { data: storiesData } = await supabase
          .from('flow_stories')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        if (mounted && storiesData) {
          setStories(storiesData.map((s: Record<string, unknown>) => ({
            id: String(s.id),
            title: (s.title as string) || 'Flow Story',
            steps: s.steps || [],
            created_at: s.created_at,
          })))
        }
      } catch {
        // flow_stories is optional decoration for the feed
      }
    }

    void init()
    return () => { mounted = false }
  }, [router])

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Nairi Flow</h1>
            <p className="text-xs text-muted-foreground">Share, like and discuss AI creations</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          {stories.length > 0 && (
            <section>
              <FlowStories stories={stories} />
            </section>
          )}

          <section>
            <FlowFeed currentUserId={userId} />
          </section>
        </div>
      </div>
    </div>
  )
}
