"use client"

import { Image as ImageIcon, Loader2, Send, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface FlowComposerProps {
  onPosted?: () => void
  className?: string
}

const MEDIA_TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "website", label: "Website" },
  { value: "code", label: "Code" },
] as const

export function FlowComposer({ onPosted, className }: FlowComposerProps) {
  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [showMedia, setShowMedia] = useState(false)
  const [tags, setTags] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const maxLength = 2000
  const remaining = maxLength - content.length

  const detectType = (url: string): string => {
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) return "image"
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return "video"
    if (/github|codepen|jsfiddle/i.test(url)) return "code"
    return "website"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        content: content.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8),
      }
      if (mediaUrl.trim()) {
        payload.media_url = mediaUrl.trim()
        payload.media_type = detectType(mediaUrl.trim())
      }

      const res = await fetch("/api/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to post")
        return
      }

      toast.success("Shared to Flow")
      setContent("")
      setMediaUrl("")
      setTags("")
      setShowMedia(false)
      onPosted?.()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3", className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share what you created, ask, or inspire..."
        maxLength={maxLength}
        className="min-h-[80px] bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/40 resize-none p-0"
        required
      />

      {showMedia && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://... (image, video or site URL)"
            className="flex-1 h-9 px-3 rounded-lg border border-white/10 bg-black/30 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#e052a0]/50"
          />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white/50" onClick={() => { setShowMedia(false); setMediaUrl("") }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="tags (comma separated)"
        className="w-full h-9 px-3 rounded-lg border border-transparent bg-black/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/10"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="gap-2 text-white/60 hover:text-white hover:bg-white/10" onClick={() => setShowMedia((v) => !v)}>
            <ImageIcon className="h-4 w-4" />
            Media
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-xs", remaining < 100 ? "text-orange-400" : "text-white/30")}>{remaining}</span>
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !content.trim()}
            className="gap-2 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white border-0"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Share
          </Button>
        </div>
      </div>
    </form>
  )
}
