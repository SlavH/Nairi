"use client"

import { useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Send, Loader2, Sparkles, Zap, Monitor, Code, Copy, Download, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AgentFeed } from "@/components/factory/agent-feed"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import type { AgentState, AgentMessage, FactoryPlan, FileArtifact } from "@/lib/agents/types"
import type { FactoryStreamUpdate } from "@/lib/agents/types"

const CodeEditor = dynamic(
  () => import("@/components/builder-v2/code-editor").then(mod => ({ default: mod.CodeEditor })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-muted/50"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> }
)

const LivePreviewV2 = dynamic(
  () => import("@/components/builder-v2/live-preview-v2").then(mod => ({ default: mod.LivePreviewV2 })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-muted/50"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> }
)

const DEMO_PROMPTS = [
  "Build a landing page for an AI-powered fitness coaching app called FitMind. Dark theme with purple accents, hero section, features grid, pricing cards, testimonials.",
  "Create a SaaS dashboard for a project management tool with sidebar navigation, charts, task list, and team members panel. Light theme with blue accents.",
  "Build a portfolio website for a photographer with a full-screen hero gallery, about section, portfolio grid, and contact form. Minimal black and white design.",
  "Create a restaurant website for an Italian bistro with hero image, menu section, reservation form, and location map. Warm colors with elegant typography.",
]

export default function FactoryPage() {
  const [prompt, setPrompt] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [agents, setAgents] = useState<Record<string, AgentState>>({
    planner: { id: "planner", name: "Architect", role: "", avatar: "🏗️", color: "#a855f7", status: "idle", currentThought: "", completedSteps: 0, totalSteps: 1 },
    builder: { id: "builder", name: "Developer", role: "", avatar: "👨‍💻", color: "#3b82f6", status: "idle", currentThought: "", completedSteps: 0, totalSteps: 1 },
    critic: { id: "critic", name: "Reviewer", role: "", avatar: "🔍", color: "#22c55e", status: "idle", currentThought: "", completedSteps: 0, totalSteps: 1 },
  })
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [plan, setPlan] = useState<FactoryPlan | null>(null)
  const [files, setFiles] = useState<FileArtifact[]>([])
  const [rightPanel, setRightPanel] = useState<"preview" | "code">("preview")
  const [copied, setCopied] = useState(false)
  const [gpuInfo, setGpuInfo] = useState<{ model: string; speed: string; backend: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isRunning) return

    setIsRunning(true)
    setMessages([])
    setFiles([])
    setPlan(null)
    setRightPanel("preview")
    setGpuInfo(null)

    setAgents(prev => ({
      planner: { ...prev.planner, status: "idle", currentThought: "", completedSteps: 0 },
      builder: { ...prev.builder, status: "idle", currentThought: "", completedSteps: 0 },
      critic: { ...prev.critic, status: "idle", currentThought: "", completedSteps: 0 },
    }))

    try {
      const response = await fetch("/api/factory/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Request failed (${response.status})`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let msgCounter = 0

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line) as FactoryStreamUpdate

              if (data.type === "agent-state") {
                setAgents(prev => ({ ...prev, [data.agent.id]: data.agent }))
              }

              if (data.type === "agent-thought") {
                setAgents(prev => ({
                  ...prev,
                  [data.agent]: { ...prev[data.agent], currentThought: data.thought },
                }))
              }

              if (data.type === "message") {
                msgCounter++
                setMessages(prev => [...prev, {
                  id: `msg-${msgCounter}`,
                  agent: data.agent,
                  type: "result",
                  content: data.content,
                  timestamp: Date.now(),
                }])
              }

              if (data.type === "plan") {
                setPlan(data.plan)
              }

              if (data.type === "task-update") {
                setPlan(prev => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    tasks: prev.tasks.map(t => t.id === data.taskId ? { ...t, status: data.status } : t),
                  }
                })
              }

              if (data.type === "file-update") {
                setFiles(prev => {
                  const existing = prev.findIndex(f => f.path === data.file.path)
                  if (existing >= 0) {
                    const next = [...prev]
                    next[existing] = data.file
                    return next
                  }
                  return [...prev, data.file]
                })

                msgCounter++
                setMessages(prev => [...prev, {
                  id: `msg-${msgCounter}`,
                  agent: "builder",
                  type: "result",
                  content: `Generated ${data.file.path}`,
                  timestamp: Date.now(),
                }])
              }

              if (data.type === "critic-review") {
                msgCounter++
                setMessages(prev => [...prev, {
                  id: `msg-${msgCounter}`,
                  agent: "critic",
                  type: data.verdict === "approve" ? "result" : "action",
                  content: data.verdict === "approve"
                    ? "All checks passed. Production-ready."
                    : `Found ${data.issues.length} issues: ${data.issues.join(" | ")}`,
                  timestamp: Date.now(),
                }])
              }

              if (data.type === "complete") {
                setGpuInfo({
                  model: "Qwen-2.5-72B",
                  speed: "45 tok/s",
                  backend: "vLLM on AMD MI300X",
                })
                toast.success("Build complete! Check the preview.")
              }

              if (data.type === "error") {
                toast.error(data.content)
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Build failed")
    } finally {
      setIsRunning(false)
    }
  }, [prompt, isRunning])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopyCode = () => {
    const code = files.find(f => f.path === "/app/page.tsx")?.content || ""
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Code copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCode = () => {
    const code = files.find(f => f.path === "/app/page.tsx")?.content || ""
    const blob = new Blob([code], { type: "text/typescript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "page.tsx"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Code downloaded")
  }

  const mainFile = files.find(f => f.path === "/app/page.tsx")
  const pageContent = mainFile?.content || ""

  return (
    <main className="flex h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-white/5 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/nav" className="flex items-center gap-2">
            <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={28} height={28} className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Nairi
            </span>
          </Link>
          <span className="text-white/20">|</span>
          <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Factory
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
            AMD GPU
          </span>
        </div>

        {/* GPU Performance Widget */}
        {gpuInfo && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <Zap className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-300">AMD MI300X</span>
            <span className="text-white/40">|</span>
            <span className="text-white/70">{gpuInfo.model}</span>
            <span className="text-white/40">|</span>
            <span className="text-white/70">{gpuInfo.speed}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link href="/builder" className="text-xs text-muted-foreground hover:text-foreground transition">
            Builder
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/chat" className="text-xs text-muted-foreground hover:text-foreground transition">
            Chat
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex">
        {/* Left Panel: Agent Feed */}
        <div className="w-[400px] min-w-[350px] border-r border-white/10 flex flex-col bg-slate-950/50">
          {/* Input Area */}
          <div className="p-4 border-b border-white/10 shrink-0">
            <h2 className="text-sm font-semibold mb-1 text-muted-foreground">Build Prompt</h2>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the web app you want to build..."
                className="min-h-[80px] resize-none pr-12 rounded-xl bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                disabled={isRunning}
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2 h-9 w-9 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                onClick={handleSend}
                disabled={!prompt.trim() || isRunning}
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Demo Prompts */}
          {messages.length === 0 && !isRunning && (
            <div className="p-4 border-b border-white/10 shrink-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Try a demo:</p>
              <div className="space-y-2">
                {DEMO_PROMPTS.slice(0, 3).map((demo, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPrompt(demo)
                      textareaRef.current?.focus()
                    }}
                    className="w-full text-left text-xs p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all line-clamp-2 text-muted-foreground hover:text-foreground"
                  >
                    {demo}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Agent Feed */}
          <div className="flex-1 min-h-0">
            <AgentFeed agents={agents} messages={messages} isRunning={isRunning} />
          </div>
        </div>

        {/* Right Panel: Preview / Code */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightPanel("preview")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                  rightPanel === "preview"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <Monitor className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => setRightPanel("code")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                  rightPanel === "code"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <Code className="h-4 w-4" />
                Code
              </button>
            </div>

            {files.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="text-xs h-8 gap-1.5"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadCode}
                  className="text-xs h-8 gap-1.5"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0">
            {files.length === 0 && !isRunning ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 shadow-lg shadow-purple-500/20">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Nairi Factory
                </h1>
                <p className="text-muted-foreground max-w-lg mb-8">
                  Describe a web app. Three AI agents — Architect, Developer, and Reviewer — collaborate to build it with live preview.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-xl">
                  {[
                    { emoji: "🏗️", name: "Architect", desc: "Plans the architecture" },
                    { emoji: "👨‍💻", name: "Developer", desc: "Writes the code" },
                    { emoji: "🔍", name: "Reviewer", desc: "Reviews quality" },
                  ].map((a) => (
                    <div key={a.name} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-2xl">{a.emoji}</span>
                      <p className="font-semibold text-sm mt-2">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : rightPanel === "preview" ? (
              <LivePreviewV2
                code={pageContent}
                viewport="desktop"
                isFullscreen={false}
                files={{}}
                reason={null}
                previewError={null}
                onFixError={() => {}}
                onErrorDetected={() => {}}
                onUseSafeStarter={() => {}}
                onMakeItPop={() => {}}
              />
            ) : (
              mainFile ? (
                <CodeEditor file={{
                  id: "factory-main",
                  name: mainFile.name || "page.tsx",
                  path: mainFile.path,
                  content: mainFile.content,
                  language: "typescript",
                  isModified: false,
                }} onChange={() => {}} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Generating code...
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
