"use client"

import { Loader2, Sparkles, Users, Compass, TrendingUp, Clock } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"

import { FlowComposer } from "./flow-composer"
import { FlowCard, type FlowCardData } from "./flow-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FlowSortOption = "foryou" | "following" | "trending" | "new"

interface FlowFeedProps {
  currentUserId?: string | null
}

export function FlowFeed({ currentUserId }: FlowFeedProps) {
  const [items, setItems] = useState<FlowCardData[]>([])
  const [sortBy, setSortBy] = useState<FlowSortOption>("foryou")
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const sortOptions: { id: FlowSortOption; label: string; icon: typeof Compass }[] = [
    { id: "foryou", label: "For You", icon: Compass },
    { id: "following", label: "Following", icon: Users },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "new", label: "New", icon: Clock },
  ]

  const fetchData = useCallback(async (pageNum: number, sort: FlowSortOption, append = false) => {
    if (append) setLoadingMore(true)

    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "10", sort })
      const response = await fetch(`/api/flow?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      setFollowingIds(new Set<string>(data.following || []))

      if (append) {
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id))
          return [...prev, ...(data.items || []).filter((i: FlowCardData) => !seen.has(i.id))]
        })
      } else {
        setItems(data.items || [])
      }
      setHasMore(Boolean(data.hasMore))
    } catch (error) {
      console.error("Error fetching flow data:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchData(1, sortBy)
  }, [sortBy, fetchData])

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          const next = page + 1
          setPage(next)
          fetchData(next, sortBy, true)
        }
      },
      { threshold: 0.1 }
    )
    observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, page, sortBy, fetchData])

  const handlePosted = () => {
    setPage(1)
    setSortBy("foryou")
    fetchData(1, "foryou")
  }

  const handleFollowChange = useCallback((userId: string, nowFollowing: boolean) => {
    setFollowingIds((prev) => {
      const next = new Set(prev)
      if (nowFollowing) next.add(userId)
      else next.delete(userId)
      return next
    })
  }, [])

  const handleDeleted = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <FlowComposer onPosted={handlePosted} />

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {sortOptions.map((option) => {
          const Icon = option.icon
          return (
            <Button
              key={option.id}
              variant={sortBy === option.id ? "default" : "secondary"}
              size="sm"
              onClick={() => {
                setPage(1)
                setLoading(true)
                setSortBy(option.id)
              }}
              className={cn(
                "gap-2 shrink-0 transition-all rounded-full",
                sortBy === option.id
                  ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white border-0"
                  : "bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#e052a0]" />
            <p className="text-sm text-muted-foreground">Loading flow...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-[#e052a0]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {sortBy === "following" ? "Your following feed is empty" : "No posts yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {sortBy === "following"
              ? "Follow people from the feed to see their creations here."
              : "Share your first creation with the composer above."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FlowCard
              key={item.id}
              data={item}
              isFollowing={followingIds.has(item.user_id)}
              onFollowChange={handleFollowChange}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
