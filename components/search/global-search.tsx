"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, MessageSquare, Sparkles, Store, Loader2, Command } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { useDebounce } from "@/hooks/use-debounce"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface SearchResult {
  type: string
  id: string
  title: string
  description: string
  url: string
  created_at: string
}

const typeIcons: Record<string, typeof Search> = {
  conversation: MessageSquare,
  creation: Sparkles,
  agent: Store
}

const typeColors: Record<string, string> = {
  conversation: "bg-blue-500/10 text-blue-500",
  creation: "bg-purple-500/10 text-purple-500",
  agent: "bg-orange-500/10 text-orange-500"
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useSWR<{ results: SearchResult[] }>(
    debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery("")
    router.push(result.url)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 86400000) return "Today"
    if (diff < 172800000) return "Yesterday"
    return date.toLocaleDateString()
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative w-full max-w-md justify-start text-muted-foreground bg-background/50 hover:bg-background"
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="flex-1 text-left">Search conversations, creations, agents...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium sm:flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl gap-0 overflow-hidden">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations, creations, agents..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[400px]">
            {query.length < 2 ? (
              <div className="py-12 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Type at least 2 characters to search</p>
                <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd> to select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd> to close
                  </span>
                </div>
              </div>
            ) : isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : data?.results.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No results found for "{query}"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching with different keywords
                </p>
              </div>
            ) : (
              <div className="p-2">
                {data?.results.map((result) => {
                  const Icon = typeIcons[result.type] || Search
                  
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeColors[result.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(result.created_at)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
