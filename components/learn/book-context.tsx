"use client"

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react"

export interface SourceItem {
  id: string
  title: string
  content: string
  source_type: string
  url?: string | null
  created_at: string
}

interface BookContextValue {
  notebookId: string
  notebookTitle: string
  sources: SourceItem[]
  addSource: (source: SourceItem) => void
  removeSource: (sourceId: string) => void
  navigateToConcepts: () => void
}

const BookContext = createContext<BookContextValue | null>(null)

export function BookProvider({
  notebookId,
  notebookTitle,
  initialSources,
  onNavigateToConcepts,
  children,
}: {
  notebookId: string
  notebookTitle: string
  initialSources: SourceItem[]
  onNavigateToConcepts?: () => void
  children: ReactNode
}) {
  const [sources, setSources] = useState<SourceItem[]>(initialSources)

  const addSource = useCallback((source: SourceItem) => {
    setSources((prev) => [...prev, source])
  }, [])

  const removeSource = useCallback((sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId))
  }, [])

  const navigateToConcepts = useCallback(() => {
    onNavigateToConcepts?.()
  }, [onNavigateToConcepts])

  const value = useMemo<BookContextValue>(
    () => ({
      notebookId,
      notebookTitle,
      sources,
      addSource,
      removeSource,
      navigateToConcepts,
    }),
    [notebookId, notebookTitle, sources, addSource, removeSource, navigateToConcepts],
  )

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>
}

export function useBook(): BookContextValue {
  const context = useContext(BookContext)
  if (!context) {
    throw new Error("useBook must be used within a BookProvider")
  }
  return context
}
