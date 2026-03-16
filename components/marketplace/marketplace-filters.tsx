"use client"

import React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal, X } from "lucide-react"

interface MarketplaceFiltersProps {
  categories: string[]
  currentCategory: string
  currentSort: string
  searchQuery: string
  /** all | agents | creations */
  currentListType?: string
}

export function MarketplaceFilters({
  categories,
  currentCategory,
  currentSort,
  searchQuery,
  currentListType = "all",
}: MarketplaceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchQuery)

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === "type") {
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
    } else if (value && value !== "all" && value !== "popular") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/marketplace?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams("q", search)
  }

  const clearFilters = () => {
    setSearch("")
    router.push("/marketplace")
  }

  const clearType = () => updateParams("type", "all")

  const hasActiveFilters = searchQuery || currentCategory !== "all" || currentSort !== "popular" || currentListType !== "all"

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description..."
            aria-label="Search marketplace agents"
            className="pl-10 bg-white/10 border-white/20 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus-visible:ring-[#e052a0]/50"
          />
        </div>
        <Button type="submit" className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
          Search
        </Button>
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>

        {/* Type: All | Agents | Creations */}
        <Select value={currentListType} onValueChange={(v) => updateParams("type", v)}>
          <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-foreground">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="agents">Agents</SelectItem>
            <SelectItem value="creations">Creations</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={currentCategory} onValueChange={(v) => updateParams("category", v)}>
          <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-foreground">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select value={currentSort} onValueChange={(v) => updateParams("sort", v)}>
          <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-foreground">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#e052a0]/10 text-[#e052a0] text-sm">
              <span>Search: {searchQuery}</span>
              <button onClick={() => updateParams("q", "")} className="hover:bg-[#e052a0]/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {currentCategory !== "all" && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#00c9c8]/10 text-[#00c9c8] text-sm">
              <span>Category: {currentCategory}</span>
              <button onClick={() => updateParams("category", "all")} className="hover:bg-[#00c9c8]/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {currentSort !== "popular" && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
              <span>Sort: {currentSort.replace("_", " ")}</span>
              <button onClick={() => updateParams("sort", "popular")} className="hover:bg-muted/80 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {currentListType !== "all" && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-foreground text-sm">
              <span>Type: {currentListType === "agents" ? "Agents" : "Creations"}</span>
              <button onClick={clearType} className="hover:bg-white/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
