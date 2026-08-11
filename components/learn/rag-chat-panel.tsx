"use client"

import {
  MessageSquare,
  Loader2,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  FileText,
  Network,
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  loadChatHistory,
  saveChatTurns,
  clearChat,
  saveFeedback,
  type ChatTurn,
} from "@/lib/nairibook/chat-store"
import { buildNotebookDoc, loadNotebookDoc, type NotebookDoc } from "@/lib/nairibook/notebook-doc"
import { runRagChat, type RagSource } from "@/lib/nairibook/rag"
import { createClient } from "@/lib/supabase/client"

import { useBook } from "./book-context"


interface Msg {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: RagSource[]
  streaming?: boolean
}

export function RagChatPanel() {
  const { notebookId, notebookTitle, sources, navigateToConcepts } = useBook()
  const [doc, setDoc] = useState<NotebookDoc | null>(null)
  const [building, setBuilding] = useState(false)
  const [buildMsg, setBuildMsg] = useState("")
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load cached document + chat history on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const cached = await loadNotebookDoc(notebookId)
      const history = await loadChatHistory(notebookId)
      if (cancelled) return
      if (cached) setDoc(cached)
      if (history.length) setMessages(history.map((t) => ({ id: t.turnId, role: t.role, content: t.content, sources: t.sources })))
    })()
    return () => {
      cancelled = true
    }
  }, [notebookId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const ensureDoc = useCallback(async (): Promise<NotebookDoc | null> => {
    if (doc) return doc
    setBuilding(true)
    setBuildMsg("Loading sources…")
    try {
      const supabase = createClient()
      const { data: sources } = (await supabase
        .from("learn_notebook_sources")
        .select("id, title, content")
        .eq("notebook_id", notebookId)
        .order("created_at", { ascending: true })) as { data: { id: string; title: string; content: string | null }[] | null }
      if (!sources || sources.length === 0) {
        toast.error("Add at least one source to this NairiBook first.")
        return null
      }
      const built = await buildNotebookDoc(
        notebookId,
        sources.map((s) => ({ id: s.id, title: s.title, content: s.content ?? "" })),
        setBuildMsg
      )
      setDoc(built)
      return built
    } catch (e) {
      toast.error("Failed to prepare document: " + (e as Error).message)
      return null
    } finally {
      setBuilding(false)
    }
  }, [doc, notebookId])

  const persist = useCallback(
    async (next: Msg[]) => {
      const turns: ChatTurn[] = next
        .filter((m) => !m.streaming)
        .map((m) => ({
          turnId: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          createdAt: Date.now(),
        }))
      await saveChatTurns(notebookId, turns)
    },
    [notebookId]
  )

  const send = async () => {
    const q = input.trim()
    if (!q || busy) return
    const d = await ensureDoc()
    if (!d) return

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: q }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Msg = { id: assistantId, role: "assistant", content: "", sources: [], streaming: true }
    const next = [...messages, userMsg, assistantMsg]
    setMessages(next)
    setInput("")
    setBusy(true)

    const history = next
      .slice(0, -1)
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }))

    const ac = new AbortController()
    abortRef.current = ac

    try {
      setStatus("Searching document…")
      const result = await runRagChat({
        query: q,
        chunks: d.chunks,
        vectors: d.vectors,
        history: history as any,
        signal: ac.signal,
        onToken: (delta) => {
          setStatus("Generating answer…")
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m))
          )
        },
        onSources: (sources) => {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, sources } : m)))
        },
      })

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: result.answer, sources: result.sources, streaming: false } : m))
      )
      const finalMsgs = next.map((m) =>
        m.id === assistantId ? { ...m, content: result.answer, sources: result.sources, streaming: false } : m
      )
      await persist(finalMsgs)
    } catch (e) {
      if ((e as Error).message?.includes("aborted")) {
        toast.info("Cancelled.")
      } else {
        toast.error("Chat failed: " + (e as Error).message)
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: "An error occurred. Try again.", streaming: false } : m))
      )
    } finally {
      setBusy(false)
      setStatus(null)
      abortRef.current = null
    }
  }

  const copyAnswer = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Answer copied")
  }

  const markFeedback = async (msgId: string, helpful: boolean) => {
    setFeedback((f) => ({ ...f, [msgId]: helpful }))
    await saveFeedback(notebookId, msgId, helpful)
  }

  const clearHistory = async () => {
    await clearChat(notebookId)
    setMessages([])
    toast.success("Chat history cleared")
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      {/* Status / build progress */}
      {(building || status) && (
        <div className="shrink-0 border-b border-white/20 px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          {building ? buildMsg : status}
          {building && <Progress value={50} className="h-1 w-32" />}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="p-4 space-y-4" role="log" aria-label="RAG chat messages" aria-live="polite">
          {messages.length === 0 && !building && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p className="font-medium text-foreground mb-1">RAG Chat</p>
              <p>Unlike the general Chat tab, RAG Chat searches within your uploaded sources and cites specific chapters. Ask a question — the system finds relevant passages and answers grounded in your materials.</p>
              {sources.length === 0 && (
                <Button variant="outline" size="sm" onClick={navigateToConcepts} className="mt-3 border-[#22d3ee]/50 text-[#22d3ee]">
                  <Network className="h-3.5 w-3.5 mr-1" /> Process a PDF
                </Button>
              )}
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-[#e052a0]/20 border border-[#e052a0]/20 text-foreground" : "bg-white/10 border border-white/20 text-foreground"}`}>
                <p className="whitespace-pre-wrap break-words">
                  {m.content}
                  {m.streaming && <span className="inline-block w-2 h-4 align-middle bg-current opacity-60 animate-pulse ml-0.5" />}
                </p>

                {/* Sources + actions for assistant messages */}
                {m.role === "assistant" && !m.streaming && m.content && (
                  <div className="mt-2 space-y-2">
                    {m.sources && m.sources.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Sources:</p>
                        {m.sources.slice(0, 5).map((s, i) => (
                          <Collapsible key={i} className="border border-white/10 rounded">
                            <CollapsibleTrigger asChild>
                              <button className="w-full flex items-center gap-1.5 px-2 py-1 text-left text-[11px] text-muted-foreground hover:text-foreground">
                                <FileText className="h-3 w-3 shrink-0" />
                                <Badge variant="secondary" className="bg-muted/50 text-[10px]">Chapter {s.chapterIndex + 1}</Badge>
                                <span className="truncate">{s.chapterTitle}</span>
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <p className="px-2 py-1 text-[11px] text-foreground/80 max-h-40 overflow-y-auto">{s.text}</p>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 pt-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Copy" onClick={() => copyAnswer(m.content)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${feedback[m.id] === true ? "text-green-400" : ""}`}
                        title="Helpful"
                        onClick={() => markFeedback(m.id, true)}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${feedback[m.id] === false ? "text-red-400" : ""}`}
                        title="Not helpful"
                        onClick={() => markFeedback(m.id, false)}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-white/20 bg-white/5 backdrop-blur-sm">
        <div className="flex gap-2">
          <textarea
            placeholder="Ask about your book…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            className="min-h-[44px] max-h-[120px] resize-none flex-1 bg-white/10 border-white/20 backdrop-blur-md text-foreground text-sm placeholder:text-muted-foreground rounded-md px-3 py-2"
            disabled={busy || building}
          />
          <Button
            size="icon"
            className="shrink-0 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90 h-11 w-11"
            onClick={send}
            disabled={busy || building || !input.trim()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
        </div>
        {messages.length > 0 && (
          <div className="flex justify-end mt-1">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearHistory}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear chat history
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
