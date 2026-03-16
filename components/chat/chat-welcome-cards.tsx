"use client"

import { useRouter } from "next/navigation"
import { MessageSquare, Sparkles, Code, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const FEATURES = [
  { icon: Sparkles, title: "Creative Writing", desc: "Stories, poems, articles", slug: "creative-writing", suggestion: "Help me with creative writing: stories, poems, articles" },
  { icon: Code, title: "Code Generation", desc: "Apps, scripts, functions", slug: "code-generation", suggestion: "Help me with code: apps, scripts, functions" },
  { icon: Search, title: "Research & Analysis", desc: "Deep research, summaries", slug: "research-analysis", suggestion: "Help me with research and analysis: deep research, summaries" },
  { icon: MessageSquare, title: "General Chat", desc: "Ask anything", slug: "general-chat", suggestion: "Let's chat — ask me anything" },
] as const

export function ChatWelcomeCards() {
  const router = useRouter()
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  const handleCardClick = async (slug: string, suggestion: string) => {
    setLoadingSlug(slug)
    try {
      const res = await fetch("/api/chat/conversations", { method: "POST" })
      const contentType = res.headers.get("content-type") ?? ""
      const body = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : {}
      if (!res.ok) {
        toast.error(body?.error ?? "Could not start chat. Please try again or sign in.")
        return
      }
      const id = body?.id
      if (id) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("chat:conversation-created", { detail: { id } }))
        }
        const params = new URLSearchParams()
        params.set("suggestion", suggestion)
        router.push(`/chat/${id}?${params.toString()}`)
      } else {
        toast.error("Could not start chat. Please try again.")
      }
    } catch {
      toast.error("Could not start chat. Please try again or sign in.")
    } finally {
      setLoadingSlug(null)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FEATURES.map((item) => (
        <button
          key={item.title}
          type="button"
          onClick={() => handleCardClick(item.slug, item.suggestion)}
          disabled={loadingSlug !== null}
          className="section-card p-5 text-left hover:border-[#e879f9]/40 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-[#e879f9]/50 focus:ring-offset-2 focus:ring-offset-background min-h-[44px] touch-manipulation"
          aria-label={`Start new chat: ${item.title} — ${item.desc}`}
        >
          <item.icon className="h-6 w-6 text-[#e879f9] mb-2" />
          <h3 className="font-medium text-foreground">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.desc}</p>
        </button>
      ))}
    </div>
  )
}
