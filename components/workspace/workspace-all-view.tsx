"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  Filter,
  Presentation,
  Globe,
  FileText,
  Palette,
  Code,
  BarChart3,
  Folder,
  Star,
  MoreHorizontal,
} from "lucide-react"

const typeIcons: Record<string, typeof Presentation> = {
  presentation: Presentation,
  website: Globe,
  document: FileText,
  visual: Palette,
  code: Code,
  analysis: BarChart3,
}

const typeColors: Record<string, string> = {
  presentation: "from-orange-500 to-red-500",
  website: "from-blue-500 to-cyan-500",
  document: "from-green-500 to-emerald-500",
  visual: "from-pink-500 to-rose-500",
  code: "from-slate-500 to-zinc-600",
  analysis: "from-indigo-500 to-violet-500",
}

interface Creation {
  id: string
  type: string
  prompt: string
  content: string
  created_at: string
  is_favorite?: boolean
}

export function WorkspaceAllView({
  creations,
  initialSearch,
  initialType,
  initialSort,
}: {
  creations: Creation[]
  initialSearch: string
  initialType: string
  initialSort: string
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [typeFilter, setTypeFilter] = useState(initialType)
  const [sortBy, setSortBy] = useState(initialSort)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    updateURL(value, typeFilter, sortBy)
  }

  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
    updateURL(searchQuery, value, sortBy)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateURL(searchQuery, typeFilter, value)
  }

  const updateURL = (search: string, type: string, sort: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type !== 'all') params.set('type', type)
    if (sort !== 'newest') params.set('sort', sort)
    
    const queryString = params.toString()
    router.push(`/workspace/all${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="bg-transparent">
              <Link href="/workspace">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-semibold text-foreground">All Creations</h1>
            <Badge variant="outline">{creations.length}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search creations..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Creations Grid */}
        {creations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creations.map((creation) => {
              const Icon = typeIcons[creation.type] || FileText
              return (
                <Link
                  key={creation.id}
                  href={`/workspace/${creation.id}`}
                  className="p-4 rounded-xl border border-border bg-card/50 hover:border-[#22d3ee]/50 transition-all group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-r ${
                        typeColors[creation.type] || "from-gray-500 to-gray-600"
                      } flex items-center justify-center`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-medium text-foreground line-clamp-2 min-h-[2.5rem]">
                    {creation.prompt}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {creation.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(creation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="bg-card/50 border-border">
            <CardContent className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">
                {searchQuery || typeFilter !== 'all'
                  ? "No creations match your filters"
                  : "No creations yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || typeFilter !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Start by creating your first project"}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
