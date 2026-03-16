"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Link as LinkIcon, Send, Loader2, Trash2, Sparkles, BookOpen, HelpCircle, FileCheck, Upload, Mic, ListOrdered, Lightbulb, ListChecks } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"

interface Source {
  id: string
  title: string
  content: string
  source_type: string
  url?: string | null
  created_at: string
}

interface NotebookViewProps {
  notebookId: string
  notebookTitle: string
  initialSources: Source[]
}

export function NotebookView({ notebookId, notebookTitle, initialSources }: NotebookViewProps) {
  const router = useRouter()
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [addTitle, setAddTitle] = useState("")
  const [addContent, setAddContent] = useState("")
  const [addUrl, setAddUrl] = useState("")
  const [addTab, setAddTab] = useState<"url" | "paste" | "upload">("url")
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [generations, setGenerations] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [generationsOpen, setGenerationsOpen] = useState(true)

  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const addSource = useCallback(async () => {
    if (addTab === "url") {
      const url = addUrl.trim()
      if (!url) {
        toast.error("Enter a URL")
        return
      }
      if (!/^https?:\/\//i.test(url)) {
        toast.error("URL must start with http:// or https://")
        return
      }
    } else if (addTab === "upload") {
      if (!uploadFile) {
        toast.error("Choose a PDF or text file")
        return
      }
    } else {
      if (!addContent.trim()) {
        toast.error("Paste some content")
        return
      }
    }
    const title = addTitle.trim() || (addTab === "url" ? addUrl.slice(0, 80) : addTab === "upload" && uploadFile ? uploadFile.name : "Pasted content")
    setAdding(true)
    try {
      let res: Response
      if (addTab === "upload" && uploadFile) {
        const form = new FormData()
        form.set("file", uploadFile)
        if (title) form.set("title", title)
        res = await fetch(`/api/learn/notebooks/${notebookId}/sources/upload`, {
          method: "POST",
          body: form,
        })
      } else {
        res = await fetch(`/api/learn/notebooks/${notebookId}/sources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: addTab === "url" && addUrl.trim() ? addUrl.slice(0, 200) : title,
            content: addTab === "paste" ? addContent.trim() : "",
            source_type: addTab === "url" ? "url" : "paste",
            url: addTab === "url" ? addUrl.trim() || null : null,
          }),
        })
      }
      const text = await res.text()
      let data: { source?: Source; error?: string } = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          toast.error("Invalid response")
        }
      }
      if (data.source) {
        setSources((prev) => [...prev, data.source!])
        setAddTitle("")
        setAddContent("")
        setAddUrl("")
        setUploadFile(null)
        toast.success(addTab === "url" ? "Website researched and added" : addTab === "upload" ? "File added" : "Source added")
        router.refresh()
      } else if (res.status >= 400) {
        toast.error(data.error || "Failed to add source")
      }
    } finally {
      setAdding(false)
    }
  }, [notebookId, addTitle, addContent, addUrl, addTab, uploadFile, router])

  const removeSource = useCallback(
    async (sourceId: string) => {
      const res = await fetch(`/api/learn/notebooks/${notebookId}/sources/${sourceId}`, { method: "DELETE" })
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== sourceId))
        router.refresh()
      } else {
        const text = await res.text()
        let data: { error?: string } = {}
        if (text) try { data = JSON.parse(text) } catch { /* ignore */ }
        toast.error(data.error || "Failed to remove source")
      }
    },
    [notebookId, router]
  )

  const sendMessage = useCallback(async () => {
    const q = message.trim()
    if (!q || loading) return
    setMessage("")
    setMessages((prev) => [...prev, { role: "user", content: q }])
    setLoading(true)
    try {
      const res = await fetch(`/api/learn/notebooks/${notebookId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      })
      const text = await res.text()
      let data: { answer?: string; error?: string } = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          toast.error("Invalid response")
        }
      }
      if (data.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer! }])
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ])
        if (res.status >= 500) toast.error(data.error)
      }
    } finally {
      setLoading(false)
    }
  }, [notebookId, message, loading])

  const runGeneration = useCallback(
    async (type: "overview" | "study_guide" | "faq" | "briefing" | "outline" | "key_themes" | "podcast_script" | "action_items") => {
      if (sources.length === 0) {
        toast.error("Add at least one source first")
        return
      }
      setGenerating(type)
      try {
        const res = await fetch(`/api/learn/notebooks/${notebookId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        })
        const data = await res.json().catch(() => ({}))
        if (data.content) {
          setGenerations((prev) => ({ ...prev, [type]: data.content }))
          toast.success("Generated")
        } else {
          toast.error(data.error || "Generation failed")
        }
      } catch {
        toast.error("Generation failed")
      } finally {
        setGenerating(null)
      }
    },
    [notebookId, sources.length]
  )

  const generationLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    overview: { label: "Overview", icon: <FileText className="h-4 w-4" /> },
    study_guide: { label: "Study guide", icon: <BookOpen className="h-4 w-4" /> },
    faq: { label: "FAQ", icon: <HelpCircle className="h-4 w-4" /> },
    briefing: { label: "Briefing", icon: <FileCheck className="h-4 w-4" /> },
    outline: { label: "Outline", icon: <ListOrdered className="h-4 w-4" /> },
    key_themes: { label: "Key themes", icon: <Lightbulb className="h-4 w-4" /> },
    podcast_script: { label: "Podcast script", icon: <Mic className="h-4 w-4" /> },
    action_items: { label: "Action items", icon: <ListChecks className="h-4 w-4" /> },
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Sources panel */}
      <div className="w-72 shrink-0 border-r border-white/20 flex flex-col bg-white/5 backdrop-blur-md">
        <div className="p-3 border-b border-white/20">
          <p className="text-xs font-medium text-muted-foreground mb-2">Sources</p>
          <Tabs value={addTab} onValueChange={(v) => setAddTab(v as "url" | "paste" | "upload")}>
            <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/10 backdrop-blur-sm">
              <TabsTrigger value="url" className="text-xs">URL</TabsTrigger>
              <TabsTrigger value="paste" className="text-xs">Paste</TabsTrigger>
              <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="mt-2 space-y-2">
              <Input
                placeholder="https://example.com/article"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="bg-white/10 border-white/20 backdrop-blur-sm text-foreground text-xs placeholder:text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">
                We fetch and analyze the page. No need to paste anything.
              </p>
            </TabsContent>
            <TabsContent value="paste" className="mt-2 space-y-2">
              <Input
                placeholder="Title (optional)"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                className="bg-white/10 border-white/20 backdrop-blur-sm text-foreground text-xs placeholder:text-muted-foreground"
              />
              <Textarea
                placeholder="Paste text or notes..."
                value={addContent}
                onChange={(e) => setAddContent(e.target.value)}
                className="min-h-[80px] bg-white/10 border-white/20 backdrop-blur-sm text-foreground text-xs resize-none placeholder:text-muted-foreground"
              />
            </TabsContent>
            <TabsContent value="upload" className="mt-2 space-y-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">PDF or text file</span>
                <input
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="text-xs file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-foreground"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <Input
                placeholder="Title (optional)"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                className="bg-white/10 border-white/20 backdrop-blur-sm text-foreground text-xs placeholder:text-muted-foreground"
              />
            </TabsContent>
          </Tabs>
          <Button
            size="sm"
            className="w-full mt-2 bg-white/10 border-white/20 text-foreground hover:bg-white/20"
            onClick={addSource}
            disabled={
              adding ||
              (addTab === "url" ? !addUrl.trim() || !/^https?:\/\//i.test(addUrl.trim()) : addTab === "upload" ? !uploadFile : !addContent.trim())
            }
          >
            {adding ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                {addTab === "url" ? "Researching…" : addTab === "upload" ? "Uploading…" : "Adding…"}
              </>
            ) : addTab === "url" ? (
              "Research & add"
            ) : addTab === "upload" ? (
              "Upload & add"
            ) : (
              "Add source"
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sources.map((s) => (
            <div
              key={s.id}
              className="group flex items-start gap-2 p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {s.source_type} · {(s.content?.length ?? 0).toLocaleString()} chars
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeSource(s.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {sources.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">Add sources above. AI will answer only from them.</p>
          )}
        </div>
      </div>

      {/* Chat + Generations */}
      <div className="flex-1 flex flex-col min-h-0 bg-transparent">
        {sources.length > 0 && (
          <Collapsible open={generationsOpen} onOpenChange={setGenerationsOpen} className="shrink-0 border-b border-white/20">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-4 py-2 rounded-none text-sm text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generations
                </span>
                <span className="text-xs">{generationsOpen ? "▼" : "▶"}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(["overview", "study_guide", "faq", "briefing", "outline", "key_themes", "podcast_script", "action_items"] as const).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant="outline"
                      className="border-white/20 bg-white/5 text-xs"
                      onClick={() => runGeneration(type)}
                      disabled={!!generating}
                    >
                      {generating === type ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        generationLabels[type].icon
                      )}
                      <span className="ml-1.5">{generationLabels[type].label}</span>
                    </Button>
                  ))}
                </div>
                {Object.entries(generations).length > 0 && (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {Object.entries(generations).map(([type, content]) => (
                      <Card key={type} className="bg-white/5 border-white/20">
                        <CardHeader className="py-2 px-3">
                          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                            {generationLabels[type]?.icon}
                            {generationLabels[type]?.label ?? type}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-6">{content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p className="font-medium text-foreground mb-1">Ask about your sources</p>
              <p>Questions are answered only using the sources in this NairiBook. Add sources (URL or paste), use Generations, or ask anything.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-[#e052a0]/20 backdrop-blur-sm border border-[#e052a0]/20 text-foreground"
                    : "bg-white/10 backdrop-blur-sm border border-white/20 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask a question about your sources..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              className="min-h-[44px] max-h-[120px] resize-none bg-white/10 border-white/20 backdrop-blur-md text-foreground text-sm placeholder:text-muted-foreground"
              disabled={loading || sources.length === 0}
            />
            <Button
              size="icon"
              className="shrink-0 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90 h-11 w-11"
              onClick={sendMessage}
              disabled={loading || !message.trim() || sources.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {sources.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">Add at least one source to enable chat.</p>
          )}
        </div>
      </div>
    </div>
  )
}
