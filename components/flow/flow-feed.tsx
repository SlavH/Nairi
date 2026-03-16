"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Play,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  Plus,
  BookmarkCheck,
  Brain,
  FileText,
  Video,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  user_id: string
  content_type: "text" | "reel" | "publication" | "interactive" | "ai_generated"
  title: string
  content: string
  media_url?: string
  thumbnail_url?: string
  tags: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string
  }
  post_interactions: {
    id: string
    interaction_type: string
    user_id: string
  }[]
}

interface FlowFeedProps {
  initialPosts: Post[]
  savedPostIds: string[]
  followingIds: string[]
  userId: string
}

export function FlowFeed({ initialPosts, savedPostIds, followingIds, userId }: FlowFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [saved, setSaved] = useState<Set<string>>(new Set(savedPostIds))
  const [activeTab, setActiveTab] = useState("for-you")
  const supabase = createClient()

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId)
    const hasLiked = post?.post_interactions.some((i) => i.user_id === userId && i.interaction_type === "like")

    if (hasLiked) {
      await supabase
        .from("post_interactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("interaction_type", "like")
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: p.likes_count - 1,
                post_interactions: p.post_interactions.filter(
                  (i) => !(i.user_id === userId && i.interaction_type === "like"),
                ),
              }
            : p,
        ),
      )
    } else {
      await supabase.from("post_interactions").insert({
        post_id: postId,
        user_id: userId,
        interaction_type: "like",
      })
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: p.likes_count + 1,
                post_interactions: [
                  ...p.post_interactions,
                  { id: Date.now().toString(), user_id: userId, interaction_type: "like" },
                ],
              }
            : p,
        ),
      )
    }
  }

  const handleSave = async (postId: string) => {
    if (saved.has(postId)) {
      await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId)
      setSaved((prev) => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    } else {
      await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId })
      setSaved((prev) => new Set([...prev, postId]))
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "reel":
        return <Video className="h-4 w-4" />
      case "publication":
        return <FileText className="h-4 w-4" />
      case "ai_generated":
        return <Brain className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const filteredPosts = activeTab === "following" ? posts.filter((p) => followingIds.includes(p.user_id)) : posts

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nairi Flow</h1>
              <p className="text-muted-foreground">Discover AI-powered content</p>
            </div>
            <Link href="/flow/create">
              <Button className="gap-2 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="for-you" className="gap-2">
                <Sparkles className="h-4 w-4" />
                For You
              </TabsTrigger>
              <TabsTrigger value="following" className="gap-2">
                <Users className="h-4 w-4" />
                Following
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="for-you" className="mt-6 space-y-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    userId={userId}
                    isSaved={saved.has(post.id)}
                    onLike={() => handleLike(post.id)}
                    onSave={() => handleSave(post.id)}
                    getContentTypeIcon={getContentTypeIcon}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </TabsContent>

            <TabsContent value="following" className="mt-6 space-y-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    userId={userId}
                    isSaved={saved.has(post.id)}
                    onLike={() => handleLike(post.id)}
                    onSave={() => handleSave(post.id)}
                    getContentTypeIcon={getContentTypeIcon}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Follow creators to see their content here</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trending" className="mt-6 space-y-6">
              {posts
                .sort((a, b) => b.likes_count - a.likes_count)
                .slice(0, 10)
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    userId={userId}
                    isSaved={saved.has(post.id)}
                    onLike={() => handleLike(post.id)}
                    onSave={() => handleSave(post.id)}
                    getContentTypeIcon={getContentTypeIcon}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post,
  userId,
  isSaved,
  onLike,
  onSave,
  getContentTypeIcon,
}: {
  post: Post
  userId: string
  isSaved: boolean
  onLike: () => void
  onSave: () => void
  getContentTypeIcon: (type: string) => React.ReactNode
}) {
  const hasLiked = post.post_interactions.some((i) => i.user_id === userId && i.interaction_type === "like")
  const [timeAgo, setTimeAgo] = useState<string>("")

  // Handle date formatting on client-side only to prevent hydration mismatch
  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(post.created_at), { addSuffix: true }))
  }, [post.created_at])

  return (
    <Card className="overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.profiles?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{post.profiles?.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{post.profiles?.full_name || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {timeAgo || "just now"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {getContentTypeIcon(post.content_type)}
            {post.content_type}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {post.title && <h3 className="px-4 font-semibold text-lg">{post.title}</h3>}

      {post.content_type === "reel" && post.media_url && (
        <div className="relative aspect-[9/16] max-h-[500px] bg-black flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full h-16 w-16 bg-white/20 backdrop-blur hover:bg-white/30"
            >
              <Play className="h-8 w-8 text-white" />
            </Button>
          </div>
          {post.thumbnail_url && (
            <img src={post.thumbnail_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {(post.content_type === "text" ||
        post.content_type === "publication" ||
        post.content_type === "ai_generated") && (
        <div className="px-4 py-2">
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-sm text-[#e052a0] hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className={cn("gap-2", hasLiked && "text-red-500")} onClick={onLike}>
            <Heart className={cn("h-5 w-5", hasLiked && "fill-current")} />
            {post.likes_count}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageCircle className="h-5 w-5" />
            {post.comments_count}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 className="h-5 w-5" />
            {post.shares_count}
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onSave} className={cn(isSaved && "text-[#e052a0]")}>
          {isSaved ? <BookmarkCheck className="h-5 w-5 fill-current" /> : <Bookmark className="h-5 w-5" />}
        </Button>
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-4">Be the first to share something amazing!</p>
        <Link href="/flow/create">
          <Button className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90">Create Post</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
