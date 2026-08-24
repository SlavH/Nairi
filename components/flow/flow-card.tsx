"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Heart,
  RefreshCw,
  MessageCircle,
  Link2,
  Check,
  Copy,
  Globe,
  Code2,
  Video,
  Sparkles,
  UserPlus,
  UserCheck,
  Trash2,
  Send,
  Loader2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type FlowCardType = "image" | "website" | "code" | "video" | "simulation" | "text"

export interface FlowCardData {
  id: string
  content: string
  title?: string | null
  media_url?: string | null
  media_type: FlowCardType
  tags?: string[]
  created_at: string
  user_id: string
  user_name: string
  user_avatar: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  is_liked?: boolean
  is_own?: boolean
}

interface FlowComment {
  id: string
  content: string
  created_at: string
  user_id: string
  user_name: string
  user_avatar: string | null
}

const typeConfig: Record<FlowCardType, { icon: typeof Sparkles; label: string; gradient: string } | null> = {
  image: { icon: Sparkles, label: "Image", gradient: "from-purple-500 to-pink-500" },
  website: { icon: Globe, label: "Website", gradient: "from-cyan-500 to-blue-500" },
  code: { icon: Code2, label: "Code", gradient: "from-green-500 to-emerald-500" },
  video: { icon: Video, label: "Video", gradient: "from-red-500 to-orange-500" },
  simulation: { icon: Sparkles, label: "Simulation", gradient: "from-yellow-500 to-amber-500" },
  text: null,
}

function MediaPreview({ url, type }: { url: string; type: FlowCardType }) {
  if (type === "video") {
    return (
      <div className="relative rounded-xl overflow-hidden bg-white/5">
        <video src={url} controls preload="metadata" className="w-full max-h-[420px] object-contain bg-black/40" />
      </div>
    )
  }
  if (type === "code") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/30 hover:border-white/20 transition-colors">
        <Code2 className="h-5 w-5 text-green-400 shrink-0" />
        <span className="text-sm text-white/70 truncate">{url}</span>
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block relative rounded-xl overflow-hidden bg-white/5 group/media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Post media"
        loading="lazy"
        className="w-full max-h-[480px] object-cover transition-transform duration-300 group-hover/media:scale-[1.02]"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    </a>
  )
}

interface PostCommentsProps {
  postId: string
  open: boolean
  onClose: () => void
  canComment: boolean
  onCountChange: (delta: number) => void
}

function PostComments({ postId, open, canComment, onCountChange }: PostCommentsProps) {
  const [comments, setComments] = useState<FlowComment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/flow/${postId}/comments`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch {
      /* keep empty */
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }

  if (!loaded && !loading) void load()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/flow/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to comment")
        return
      }
      setComments((prev) => [...prev, data.comment])
      onCountChange(1)
      setDraft("")
    } catch {
      toast.error("Network error")
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="border-t border-white/10 px-4 py-3 space-y-3 bg-black/20">
      {loading && !loaded ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-white/30 py-1">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={c.user_avatar || undefined} alt={c.user_name} />
                <AvatarFallback className="bg-white/10 text-white text-xs">{c.user_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-xs font-medium text-white/80">{c.user_name}</span>
                  <p className="text-sm text-white/70 break-words">{c.content}</p>
                </div>
                <span className="text-[11px] text-white/25 ml-1">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form onSubmit={submit} className="flex items-center gap-2 pt-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment..."
            maxLength={1000}
            className="h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          <Button type="submit" size="icon" disabled={sending || !draft.trim()} className="h-9 w-9 shrink-0 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white border-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      )}
    </div>
  )
}

interface FlowCardProps {
  data: FlowCardData
  isFollowing?: boolean
  onFollowChange?: (userId: string, following: boolean) => void
  onDeleted?: (id: string) => void
}

export function FlowCard({ data, isFollowing = false, onFollowChange, onDeleted }: FlowCardProps) {
  const [liked, setLiked] = useState(Boolean(data.is_liked))
  const [likesCount, setLikesCount] = useState(data.likes_count)
  const [commentsCount, setCommentsCount] = useState(data.comments_count)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [following, setFollowing] = useState(isFollowing)
  const [followBusy, setFollowBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const config = typeConfig[data.media_type]

  const handleLike = async () => {
    const nextLiked = !liked
    // optimistic
    setLiked(nextLiked)
    setLikesCount((n) => n + (nextLiked ? 1 : -1))
    try {
      const res = await fetch(`/api/flow/${data.id}/like`, { method: "POST" })
      if (!res.ok) throw new Error()
    } catch {
      // revert on failure
      setLiked(!nextLiked)
      setLikesCount((n) => n + (nextLiked ? -1 : 1))
      toast.error("Could not update like")
    }
  }

  const handleFollow = async () => {
    setFollowBusy(true)
    try {
      const res = await fetch("/api/flow/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user_id }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Action failed")
        return
      }
      setFollowing(Boolean(json.following))
      onFollowChange?.(data.user_id, Boolean(json.following))
      toast.success(json.following ? `Following ${data.user_name}` : `Unfollowed ${data.user_name}`)
    } catch {
      toast.error("Network error")
    } finally {
      setFollowBusy(false)
    }
  }

  const handleRemix = () => {
    navigator.clipboard.writeText(data.content.slice(0, 500)).catch(() => {})
    window.location.href = `/chat?prompt=${encodeURIComponent(data.content.slice(0, 300))}`
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/flow?post=${data.id}`)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy link")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/flow/${data.id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(j.error || "Failed to delete")
        return
      }
      setDeleted(true)
      onDeleted?.(data.id)
      toast.success("Post deleted")
    } catch {
      toast.error("Network error")
    } finally {
      setDeleting(false)
    }
  }

  if (deleted) return null

  return (
    <article className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/20">
      {/* author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={data.user_avatar || undefined} alt={data.user_name} />
          <AvatarFallback className="bg-gradient-to-br from-[#e052a0]/40 to-[#00c9c8]/40 text-white">
            {data.user_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{data.user_name}</span>
            {!data.is_own && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFollow}
                disabled={followBusy}
                className={cn(
                  "h-6 px-2 text-[11px] gap-1 rounded-full",
                  following
                    ? "text-emerald-400 hover:text-emerald-300 bg-transparent"
                    : "text-[#00c9c8] hover:bg-white/10"
                )}
              >
                {following ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {following ? "Following" : "Follow"}
              </Button>
            )}
          </div>
          <p className="text-xs text-white/30">
            {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
          </p>
        </div>
        {config && (
          <Badge className={cn("gap-1 bg-gradient-to-r text-white border-0 shadow-lg shrink-0", config.gradient)}>
            <config.icon className="h-3 w-3" />
            {config.label}
          </Badge>
        )}
        {data.is_own && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 w-8 shrink-0 text-white/30 hover:text-red-400 hover:bg-red-500/10"
            aria-label="Delete post"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* content */}
      <div className="px-4 pb-3 space-y-2">
        {data.title && <h3 className="font-semibold text-white leading-snug">{data.title}</h3>}
        <p className="text-sm text-white/85 whitespace-pre-wrap break-words">{data.content}</p>
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {data.tags.map((tag) => (
              <span key={tag} className="text-xs text-[#00c9c8]">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* media */}
      {data.media_url && data.media_type !== "text" && (
        <div className="px-4 pb-3">
          <MediaPreview url={data.media_url} type={data.media_type} />
        </div>
      )}

      {/* actions */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn("gap-1.5 h-8 px-2.5 rounded-lg", liked ? "text-red-500 hover:text-red-400 hover:bg-red-500/10" : "text-white/50 hover:text-white hover:bg-white/10")}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommentsOpen((v) => !v)}
          className={cn("gap-1.5 h-8 px-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10", commentsOpen && "text-white bg-white/10")}
        >
          <MessageCircle className="h-4 w-4" />
          {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemix}
          className="gap-1.5 h-8 px-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Remix
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          className="h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          aria-label="Copy link"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* comments */}
      <PostComments
        postId={data.id}
        open={commentsOpen}
        canComment
        onClose={() => setCommentsOpen(false)}
        onCountChange={(delta) => setCommentsCount((n) => Math.max(0, n + delta))}
      />
    </article>
  )
}
