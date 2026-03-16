"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, CheckCircle, Loader2 } from "lucide-react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AgentReview {
  id: string
  rating: number
  title: string | null
  content: string
  is_verified_purchase: boolean
  helpful_count: number
  created_at: string
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

interface AgentReviewsProps {
  agentId: string
  canReview?: boolean
}

function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
}: {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const [hoverRating, setHoverRating] = useState(0)
  const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={cn(readonly ? "cursor-default" : "cursor-pointer hover:scale-110", "transition-colors")}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverRating || rating) >= star ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function AgentReviews({ agentId, canReview = true }: AgentReviewsProps) {
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, isLoading } = useSWR<{ reviews: AgentReview[] }>(
    `/api/marketplace/agents/${agentId}/reviews`,
    fetcher
  )

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast.error("Please select a rating")
      return
    }
    if (!newContent.trim()) {
      toast.error("Please write a review")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/marketplace/agents/${agentId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: newRating,
          title: newTitle.trim() || undefined,
          content: newContent.trim(),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to submit review")
      toast.success("Review submitted!")
      setShowWriteReview(false)
      setNewRating(0)
      setNewTitle("")
      setNewContent("")
      mutate(`/api/marketplace/agents/${agentId}/reviews`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const reviews = data?.reviews ?? []
  const total = reviews.length
  const average =
    total > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
      : "0"

  if (isLoading) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Reviews</CardTitle>
            <CardDescription>
              {total} review{total !== 1 ? "s" : ""} · avg {average}
            </CardDescription>
          </div>
          {canReview && (
            <Button
              variant="outline"
              onClick={() => setShowWriteReview(!showWriteReview)}
              className="border-white/20 bg-white/5 text-foreground hover:bg-white/10"
            >
              Write a review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showWriteReview && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Your rating</p>
            <StarRating rating={newRating} onRatingChange={setNewRating} size="lg" />
            <Input
              placeholder="Title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-white/10 border-white/20"
            />
            <Textarea
              placeholder="Your review..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[100px] bg-white/10 border-white/20"
              required
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting || newRating === 0 || !newContent.trim()}
                className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWriteReview(false)}
                className="border-white/20 bg-white/5 text-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {review.profiles?.full_name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {review.profiles?.full_name ?? "Anonymous"}
                      </span>
                      {review.is_verified_purchase && (
                        <Badge className="bg-green-500/10 text-green-500 border-0 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} readonly size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.title && (
                      <p className="font-medium text-foreground mt-2">{review.title}</p>
                    )}
                    <p className="text-sm text-foreground mt-1">{review.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground mt-4">No reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to review this agent</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
