"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Star, ThumbsUp, CheckCircle, Loader2 } from "lucide-react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Review {
  id: string
  rating: number
  review_text: string | null
  is_verified_purchase: boolean
  helpful_count: number
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface ReviewStats {
  total: number
  average: string | number
  distribution: Record<number, number>
}

interface ProductReviewsProps {
  productId: string
  canReview?: boolean
}

function StarRating({ rating, onRatingChange, readonly = false, size = "md" }: {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }
  
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
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverRating || rating) >= star
                ? "text-yellow-500 fill-yellow-500"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function ProductReviews({ productId, canReview = true }: ProductReviewsProps) {
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, isLoading } = useSWR<{ reviews: Review[]; stats: ReviewStats }>(
    `/api/marketplace/reviews?productId=${productId}`,
    fetcher
  )

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast.error("Please select a rating")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/marketplace/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: newRating,
          reviewText: reviewText.trim() || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit review")
      }

      toast.success("Review submitted!")
      setShowWriteReview(false)
      setNewRating(0)
      setReviewText("")
      mutate(`/api/marketplace/reviews?productId=${productId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch("/api/marketplace/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId })
      })
      mutate(`/api/marketplace/reviews?productId=${productId}`)
    } catch {
      // Silently fail
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const stats = data?.stats || { total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
  const reviews = data?.reviews || []

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Reviews</CardTitle>
            <CardDescription>{stats.total} reviews</CardDescription>
          </div>
          {canReview && (
            <Button
              variant="outline"
              onClick={() => setShowWriteReview(!showWriteReview)}
              className="bg-transparent"
            >
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Summary */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background/50">
            <span className="text-4xl font-bold text-foreground">{stats.average}</span>
            <StarRating rating={Number(stats.average)} readonly size="sm" />
            <span className="text-sm text-muted-foreground mt-1">{stats.total} reviews</span>
          </div>
          
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-8">{star}</span>
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Write Review Form */}
        {showWriteReview && (
          <div className="p-4 rounded-lg border border-border bg-background/50 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Your Rating</p>
              <StarRating rating={newRating} onRatingChange={setNewRating} size="lg" />
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Your Review (optional)</p>
              <Textarea
                placeholder="Share your experience with this product..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-[100px] bg-background"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting || newRating === 0}
                className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWriteReview(false)}
                className="bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg border border-border bg-background/50"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {review.user.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {review.user.full_name || "Anonymous"}
                      </span>
                      {review.is_verified_purchase && (
                        <Badge className="bg-green-500/10 text-green-500 border-0 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} readonly size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    
                    {review.review_text && (
                      <p className="text-sm text-foreground mt-2">{review.review_text}</p>
                    )}
                    
                    <button
                      onClick={() => handleHelpful(review.id)}
                      className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Helpful ({review.helpful_count})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground mt-4">No reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to review this product
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
