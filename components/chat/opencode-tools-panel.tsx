"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FileResult {
  path: string
  lines?: number
  line_number?: number
  submatches?: Array<{ match: string; start: number; end: number }>
}

interface FileContent {
  path: string
  content: string
  size: number
  language?: string
}

interface SessionInfo {
  id: string
  slug: string
  title: string
  time: { created: number; updated: number }
}

export function OpenCodeToolsPanel({ sessionId, opencodeUrl }: {
  sessionId?: string
  opencodeUrl?: string
}) {
  const [activeTab, setActiveTab] = useState("search")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")

  const apiCall = async (action: string, params: Record<string, string> = {}) => {
    setLoading(true)
    setError("")
    try {
      const query = new URLSearchParams({ action, sessionId: sessionId || "", ...params }).toString()
      const res = await fetch(`/api/opencode-tools?${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")
      setResults(data)
    } catch (err: any) {
      setError(err.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">OpenCode Tools</h3>
        <Badge variant="outline">Local PC</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="files">Find Files</TabsTrigger>
          <TabsTrigger value="read">Read File</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-3">
          <SearchTab onSearch={(pattern) => apiCall("search", { pattern })} loading={loading} />
        </TabsContent>

        <TabsContent value="files" className="space-y-3">
          <FindFilesTab onSearch={(query) => apiCall("find-file", { query })} loading={loading} />
        </TabsContent>

        <TabsContent value="read" className="space-y-3">
          <ReadFileTab onRead={(path) => apiCall("read-file", { path })} loading={loading} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-3">
          <SessionsTab
            onAction={(action, id) => apiCall(action, id ? { sessionId: id } : {})}
            loading={loading}
            sessionId={sessionId}
          />
        </TabsContent>
      </Tabs>

      {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
      {results && <ResultsDisplay results={results} />}
    </Card>
  )
}

function SearchTab({ onSearch, loading }: { onSearch: (pattern: string) => void; loading: boolean }) {
  const [pattern, setPattern] = useState("")

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Search file contents using regex patterns</p>
      <div className="flex gap-2">
        <Input
          placeholder="e.g., function.*handle.*|import.*React"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(pattern)}
        />
        <Button onClick={() => onSearch(pattern)} disabled={loading || !pattern}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
    </div>
  )
}

function FindFilesTab({ onSearch, loading }: { onSearch: (query: string) => void; loading: boolean }) {
  const [query, setQuery] = useState("")

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Find files by name (fuzzy match)</p>
      <div className="flex gap-2">
        <Input
          placeholder="e.g., component, utils, index"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
        />
        <Button onClick={() => onSearch(query)} disabled={loading || !query}>
          {loading ? "Finding..." : "Find"}
        </Button>
      </div>
    </div>
  )
}

function ReadFileTab({ onRead, loading }: { onRead: (path: string) => void; loading: boolean }) {
  const [path, setPath] = useState("")

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Read file contents from your PC</p>
      <div className="flex gap-2">
        <Input
          placeholder="e.g., C:/Users/User/Desktop/project/src/index.ts"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onRead(path)}
        />
        <Button onClick={() => onRead(path)} disabled={loading || !path}>
          {loading ? "Reading..." : "Read"}
        </Button>
      </div>
    </div>
  )
}

function SessionsTab({
  onAction,
  loading,
  sessionId,
}: {
  onAction: (action: string, sessionId?: string) => void
  loading: boolean
  sessionId?: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Manage OpenCode sessions on your local PC</p>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => onAction("list-sessions")} disabled={loading} variant="outline">
          {loading ? "Loading..." : "List All Sessions"}
        </Button>
        <Button onClick={() => onAction("project-info")} disabled={loading} variant="outline">
          Project Info
        </Button>
        {sessionId && (
          <Button onClick={() => onAction("session-status", sessionId)} disabled={loading} variant="secondary">
            Check Current Session
          </Button>
        )}
      </div>
    </div>
  )
}

function ResultsDisplay({ results }: { results: any }) {
  if (Array.isArray(results)) {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        <p className="text-sm font-medium">Found {results.length} results:</p>
        {results.map((item: any, i: number) => (
          <div key={i} className="text-xs bg-muted p-2 rounded font-mono">
            {item.path && <div className="text-blue-600">{item.path}</div>}
            {item.content && (
              <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {item.content.slice(0, 500)}
                {item.content.length > 500 && "..."}
              </pre>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      <pre className="text-xs bg-muted p-3 rounded overflow-auto font-mono">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  )
}
