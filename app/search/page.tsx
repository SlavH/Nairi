"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, MessageSquare, FileText, Bot, Loader2, ArrowLeft } from "lucide-react"

interface SearchResult {
  type: string
  id: string
  title: string
  description: string
  url: string
  created_at: string
}

function SearchResults() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`)
      .then((res) => {
        if (res.status === 401) {
          setError("Sign in to search")
          return { results: [] }
        }
        return res.json()
      })
      .then((data) => {
        setResults(data.results || [])
      })
      .catch(() => setError("Search failed"))
      .finally(() => setLoading(false))
  }, [q])

  const typeIcons: Record<string, typeof MessageSquare> = {
    conversation: MessageSquare,
    creation: FileText,
    agent: Bot,
  }

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Search</h2>
        <p className="text-muted-foreground">Use the search bar in the dashboard to find conversations, creations, and agents.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  if (q.length < 2) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-muted-foreground">Enter at least 2 characters to search.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Searching...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Results for &quot;{q}&quot;
        </h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
        </Button>
      </div>

      {results.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No results found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((result) => {
            const Icon = typeIcons[result.type] || FileText
            return (
              <Link key={`${result.type}-${result.id}`} href={result.url}>
                <Card className="bg-card/50 border-border/50 hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#e052a0]/20 to-[#00c9c8]/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{result.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{result.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <span className="text-muted-foreground">|</span>
          <h1 className="text-lg font-semibold text-foreground">Search</h1>
        </div>
      </div>
      <main className="px-6 py-6">
        <Suspense fallback={
          <div className="max-w-2xl mx-auto py-16 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }>
          <SearchResults />
        </Suspense>
      </main>
    </div>
  )
}
