"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { FlowCard, FlowCardData } from "./flow-card"
import { Loader2, Sparkles, TrendingUp, Clock, GitFork } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FlowSortOption = "trending" | "new" | "most-remixed"

interface FlowFeedProps {
  initialData?: FlowCardData[]
  onRemix?: (prompt: string) => void
}

export function FlowFeed({ initialData = [], onRemix }: FlowFeedProps) {
  const [items, setItems] = useState<FlowCardData[]>(initialData)
  const [sortBy, setSortBy] = useState<FlowSortOption>("trending")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  const sortOptions = [
    { id: "trending" as FlowSortOption, label: "Trending", icon: TrendingUp },
    { id: "new" as FlowSortOption, label: "New", icon: Clock },
    { id: "most-remixed" as FlowSortOption, label: "Most Remixed", icon: GitFork },
  ]
  
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return (b.metadata?.likes_count || 0) - (a.metadata?.likes_count || 0)
      case "new":
        return new Date(b.metadata?.created_at || 0).getTime() - new Date(a.metadata?.created_at || 0).getTime()
      case "most-remixed":
        return (b.metadata?.remix_count || 0) - (a.metadata?.remix_count || 0)
      default:
        return 0
    }
  })
  
  const fetchData = useCallback(async (pageNum: number, sort: FlowSortOption, append: boolean = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "12",
        sort,
      })
      
      const response = await fetch(`/api/flow?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")
      
      const data = await response.json()
      
      if (append) {
        setItems(prev => [...prev, ...data.items])
      } else {
        setItems(data.items)
      }
      
      setHasMore(data.hasMore)
    } catch (error) {
      console.error("Error fetching flow data:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])
  
  useEffect(() => {
    if (initialData.length === 0) {
      fetchData(1, sortBy)
    }
  }, [])
  
  useEffect(() => {
    if (initialData.length === 0) {
      setPage(1)
      fetchData(1, sortBy)
    }
  }, [sortBy])
  
  useEffect(() => {
    if (hasMore && loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loadingMore && hasMore) {
            setPage(prev => prev + 1)
            fetchData(page + 1, sortBy, true)
          }
        },
        { threshold: 0.1 }
      )
      
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, page, sortBy, fetchData])
  
  const handleLike = async (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              metadata: {
                ...item.metadata,
                likes_count: (item.metadata?.likes_count || 0) + 1
              }
            }
          : item
      )
    )
  }
  
  const handleRemix = (prompt: string) => {
    if (onRemix) {
      onRemix(prompt)
    } else {
      navigator.clipboard.writeText(prompt)
      window.location.href = `/chat`
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#e052a0]" />
          <p className="text-sm text-muted-foreground">Loading flow...</p>
        </div>
      </div>
    )
  }
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-[#e052a0]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No flows yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Be the first to create something amazing. Start a conversation with Nairi and share your creations.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sortOptions.map((option) => {
          const Icon = option.icon
          return (
            <Button
              key={option.id}
              variant={sortBy === option.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setSortBy(option.id)}
              className={cn(
                "gap-2 shrink-0 transition-all",
                sortBy === option.id
                  ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white border-0"
                  : "bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20"
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          )
        })}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item) => (
          <FlowCard
            key={item.id}
            data={item}
            onRemix={handleRemix}
            onLike={handleLike}
            onOpenInChat={(id) => window.location.href = `/chat?flow=${id}`}
            onRunAgain={(id) => window.location.href = `/chat?rerun=${id}`}
          />
        ))}
      </div>
      
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
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
