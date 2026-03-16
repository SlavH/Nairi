"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { BuilderChat } from "@/components/builder-v2/builder-chat"
import { FileExplorer } from "@/components/builder-v2/file-explorer"
import { TaskPanel } from "@/components/builder-v2/task-panel"
import { VersionHistory } from "@/components/builder-v2/version-history"
import { TemplateGallery } from "@/components/builder-v2/template-gallery"
import { ExportOptions } from "@/components/builder-v2/export-options"
import { PreviewErrorBoundary } from "@/components/builder-v2/preview-error-boundary"

// Lazy load heavy components to improve initial page load
// CodeEditor and LivePreviewV2 use Sandpack which is ~500KB
const CodeEditor = dynamic(
  () => import("@/components/builder-v2/code-editor").then(mod => ({ default: mod.CodeEditor })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-transparent border-t-[#e052a0] border-r-[#00c9c8] mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    ),
    ssr: false // Sandpack doesn't support SSR
  }
)

const LivePreviewV2 = dynamic(
  () => import("@/components/builder-v2/live-preview-v2").then(mod => ({ default: mod.LivePreviewV2 })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-transparent border-t-[#e052a0] border-r-[#00c9c8] mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    ),
    ssr: false // Sandpack doesn't support SSR
  }
)
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Code,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Play,
  GitBranch,
  Rocket,
  Settings,
  History,
  FolderTree,
  MessageSquare,
  ListTodo,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LayoutTemplate,
  Download,
  Save,
  FolderOpen,
  Menu,
  ChevronLeft,
  MousePointer,
  Terminal,
  Wrench
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LiveRegion } from "@/components/ui/live-region"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import type { ProjectFile, BuildPlan, Task, ProjectVersion, ChatMessage, ViewportSize, LeftPanelTab, RightPanelTab, RightSidePanelTab } from "@/lib/builder-v2/types"
import { INITIAL_FILES, VIEWPORT_SIZES } from "@/lib/builder-v2/constants"

export default function BuilderV2Page() {
  // Project state
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES)
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(INITIAL_FILES[0])
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<BuildPlan | null>(null)
  
  // UI state
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("chat")
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("preview")
  const [rightSidePanelTab, setRightSidePanelTab] = useState<RightSidePanelTab>("tools")
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [isFullscreen, setIsFullscreen] = useState(false)
  /** Last generation message from API — shown in preview */
  const [previewReason, setPreviewReason] = useState<string | null>(null)
  /** When set, preview shows this AI/API error instead of website (no starter page) */
  const [previewError, setPreviewError] = useState<string | null>(null)
  /** Announced to screen readers when generation completes successfully */
  const [generationCompleteAnnouncement, setGenerationCompleteAnnouncement] = useState<string | null>(null)
  
  // Refs
  const previewRef = useRef<HTMLIFrameElement>(null)
  // Persisted project (optional)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentProjectName, setCurrentProjectName] = useState<string>("")
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; updated_at: string }[]>([])
  const [projectsListOpen, setProjectsListOpen] = useState(false)
  const [isSavingProject, setIsSavingProject] = useState(false)

  // Clear generation-complete announcement after a short delay so it can be re-announced next time
  useEffect(() => {
    if (!generationCompleteAnnouncement) return
    const t = setTimeout(() => setGenerationCompleteAnnouncement(null), 2000)
    return () => clearTimeout(t)
  }, [generationCompleteAnnouncement])

  // Get the main page content for preview
  const getPreviewCode = useCallback(() => {
    const pageFile = files.find(f => f.path === "/app/page.tsx")
    return pageFile?.content || ""
  }, [files])

  // Build additional files for Sandpack: all files except main page (multi-page + components)
  const previewAdditionalFiles = useMemo(() => {
    const out: Record<string, string> = {}
    for (const f of files) {
      if (f.path === "/app/page.tsx") continue
      // Map /app/about/page.tsx -> /about/page.tsx, /app/components/X -> /components/X for Sandpack
      const sandpackPath = f.path.startsWith("/app/") ? f.path.slice(4) : f.path.startsWith("/") ? f.path.slice(1) : f.path
      const key = sandpackPath.startsWith("/") ? sandpackPath : `/${sandpackPath}`
      out[key] = f.content
    }
    return out
  }, [files])

  // Handle file selection
  const handleFileSelect = useCallback((file: ProjectFile) => {
    setSelectedFile(file)
    setRightPanelTab("code")
  }, [])

  // Handle file content change
  const handleFileChange = useCallback((fileId: string, newContent: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, content: newContent, isModified: true }
        : f
    ))
  }, [])

  // Fetch list of saved projects (for My projects dropdown)
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/builder/projects")
      if (!res.ok) return
      const data = await res.json()
      setProjectsList(Array.isArray(data) ? data.map((p: { id: string; name: string; updated_at: string }) => ({ id: p.id, name: p.name, updated_at: p.updated_at })) : [])
    } catch {
      toast.error("Failed to load projects list")
    }
  }, [])

  const handleSaveProject = useCallback(async () => {
    setIsSavingProject(true)
    try {
      const name = currentProjectName.trim() || (typeof window !== "undefined" ? window.prompt("Project name", "Untitled project") ?? "Untitled project" : "Untitled project")
      const payload = { name: name || "Untitled project", files: files.map((f) => ({ id: f.id, name: f.name, path: f.path, content: f.content, language: f.language })) }
      if (currentProjectId) {
        const res = await fetch(`/api/builder/projects/${currentProjectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error || "Failed to save")
        const updated = await res.json()
        setCurrentProjectName(name || "Untitled project")
        const rawVersions = Array.isArray(updated?.versions) ? updated.versions : []
        const normalizedVersions: ProjectVersion[] = rawVersions.map((v: { id: string; name: string; description?: string; files: unknown[]; createdAt: string }) => {
          const filesArray = Array.isArray(v.files) ? v.files as Array<{ id?: string; name: string; path: string; content: string; language?: string }> : []
          return {
            id: v.id,
            name: v.name,
            description: v.description ?? "",
            files: filesArray.map((f, i: number) => ({
              id: typeof f.id === "string" ? f.id : `v-${i}`,
              name: f.name || "file",
              path: f.path || "/app/file.tsx",
              content: f.content || "",
              language: (f.language === "typescript" || f.language === "javascript" || f.language === "css" || f.language === "json" || f.language === "markdown") ? f.language : "typescript",
              isModified: false,
            })),
            createdAt: new Date(v.createdAt),
            isCurrent: false,
          }
        })
        setVersions(normalizedVersions)
        toast.success("Project updated")
      } else {
        const res = await fetch("/api/builder/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error || "Failed to save")
        const data = await res.json()
        setCurrentProjectId(data.id)
        setCurrentProjectName(data.name || "Untitled project")
        toast.success("Project saved")
        fetchProjects()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save project")
    } finally {
      setIsSavingProject(false)
    }
  }, [files, currentProjectId, currentProjectName, fetchProjects])

  const handleLoadProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/builder/projects/${id}`)
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      const raw = Array.isArray(data.files) ? data.files : []
      const loaded: ProjectFile[] = raw.map((f: { id?: string; name: string; path: string; content: string; language?: string }, i: number) => ({
        id: typeof f.id === "string" ? f.id : `loaded-${i}-${Date.now()}`,
        name: f.name || "file",
        path: f.path || `/app/file-${i}.tsx`,
        content: f.content || "",
        language: (f.language === "typescript" || f.language === "javascript" || f.language === "css" || f.language === "json" || f.language === "markdown") ? f.language : "typescript",
        isModified: false,
      }))
      if (loaded.length === 0) {
        toast.info("Project has no files; keeping current files.")
        return
      }
      setFiles(loaded)
      setSelectedFile(loaded[0] ?? null)
      setCurrentProjectId(data.id)
      setCurrentProjectName(data.name || "Untitled project")
      setProjectsListOpen(false)
      setPreviewError(null)
      setPreviewReason(null)
      // Restore persisted version history for this project
      const rawVersions = Array.isArray(data.versions) ? data.versions : []
      const normalizedVersions: ProjectVersion[] = rawVersions.map((v: { id: string; name: string; description?: string; files: unknown[]; createdAt: string }) => {
        const filesArray = Array.isArray(v.files) ? v.files as Array<{ id?: string; name: string; path: string; content: string; language?: string }> : []
        return {
          id: v.id,
          name: v.name,
          description: v.description ?? "",
          files: filesArray.map((f, i: number) => ({
            id: typeof f.id === "string" ? f.id : `v-${i}`,
            name: f.name || "file",
            path: f.path || "/app/file.tsx",
            content: f.content || "",
            language: (f.language === "typescript" || f.language === "javascript" || f.language === "css" || f.language === "json" || f.language === "markdown") ? f.language : "typescript",
            isModified: false,
          })),
          createdAt: new Date(v.createdAt),
          isCurrent: false,
        }
      })
      setVersions(normalizedVersions)
      toast.success("Project loaded")
    } catch {
      toast.error("Failed to load project")
    }
  }, [])

  // Replace page with safe starter so user can unblock preview without re-prompting
  const handleUseSafeStarter = useCallback(() => {
    const safeContent = `import React from "react"

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-8">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Safe starter page</h1>
        <p className="text-slate-300">
          The previous code had errors. Use this starter or regenerate from the chat.
        </p>
      </div>
    </main>
  )
}
`
    setFiles(prev => prev.map(f =>
      f.path === "/app/page.tsx" ? { ...f, content: safeContent, isModified: true } : f
    ))
    setPreviewError(null)
    setPreviewReason(null)
  }, [])

  // Handle chat message submission
  const handleSendMessage = useCallback(async (content: string, attachments?: ChatMessage["attachments"]) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      attachments
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)
    setPreviewReason(null)
    setPreviewError(null)

    try {
      // Create build plan with placeholder - will be replaced by dynamic tasks from AI
      const plan: BuildPlan = {
        id: Date.now().toString(),
        title: `Building: ${content.slice(0, 50)}...`,
        status: "planning",
        createdAt: new Date(),
        tasks: [
          { id: "0", title: "Analyzing your request...", status: "in-progress" }
        ]
      }
      setCurrentPlan(plan)
      setLeftPanelTab("tasks")

      // Call the generation API
      const response = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          currentFiles: files,
          conversationHistory: messages
        })
      })

      if (!response.ok) {
        const text = await response.text()
        let serverMessage = `Generation failed (${response.status})`
        if (response.status === 429) {
          serverMessage = "Too many requests; try again in a minute."
        } else if (response.status >= 500) {
          serverMessage = "Server error. Check your connection and try again."
        } else try {
          const body = JSON.parse(text)
          if (body?.error) serverMessage = body.error
          else if (body?.message) serverMessage = body.message
        } catch {
          // Don't use HTML error pages as the message (e.g. Next.js 404/500)
          const isHtml = text && (text.trimStart().startsWith("<!") || text.trimStart().toLowerCase().startsWith("<html"))
          if (text && !isHtml) serverMessage = text.slice(0, 200)
          else if (isHtml) serverMessage = `Generation failed (${response.status}). The server returned an error page — check the network tab or server logs.`
        }
        throw new Error(serverMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""
      let updatedFiles: ProjectFile[] = [...files]
      let buffer = "" // Buffer for incomplete JSON lines
      let receivedComplete = false
      let streamErrorMessage: string | null = null

      // Process streaming response
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          // Split by newlines but keep incomplete lines in buffer
          const lines = buffer.split("\n")
          buffer = lines.pop() || "" // Keep the last incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue
            
            try {
              const data = JSON.parse(line)
              
              if (data.type === "plan") {
                // Received dynamic task plan from AI
                setCurrentPlan(prev => prev ? {
                  ...prev,
                  tasks: data.tasks.map((t: { id: string; title: string; status: string }) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status as Task["status"]
                  }))
                } : null)
              } else if (data.type === "task-update") {
                setCurrentPlan(prev => prev ? {
                  ...prev,
                  tasks: prev.tasks.map(t => 
                    t.id === data.taskId ? { ...t, status: data.status } : t
                  )
                } : null)
              } else if (data.type === "file-update") {
                console.log("File update received:", data.file.path)
                const existingIndex = updatedFiles.findIndex(f => f.path === data.file.path)
                if (existingIndex >= 0) {
                  updatedFiles[existingIndex] = { 
                    ...data.file, 
                    isModified: true,
                    language: data.file.language || "typescript"
                  }
                } else {
                  updatedFiles.push({ 
                    ...data.file, 
                    isModified: true,
                    language: data.file.language || "typescript"
                  })
                }
                // Force state update with new array reference
                setFiles([...updatedFiles])
                
                // Also update selected file if it matches
                if (selectedFile && selectedFile.path === data.file.path) {
                  setSelectedFile({ ...data.file, isModified: true })
                }
              } else if (data.type === "message") {
                assistantContent += data.content
                // Only show error toast for actual errors, not warnings or info messages
                const contentStr = String(data.content)
                if (contentStr && (
                  contentStr.startsWith("Error:") || 
                  contentStr.startsWith("❌") ||
                  (contentStr.toLowerCase().includes("failed") && !contentStr.toLowerCase().includes("may have minor"))
                )) {
                  toast.error(contentStr.slice(0, 150))
                }
              } else if (data.type === "preview-error") {
                setPreviewError(typeof data.content === "string" ? data.content : "AI generation failed.")
              } else if (data.type === "error") {
                receivedComplete = false
                streamErrorMessage = typeof data.content === "string" ? data.content : "Generation failed."
              } else if (data.type === "complete") {
                receivedComplete = true
                // Mark all tasks as completed when generation is done
                setCurrentPlan(prev => prev ? { 
                  ...prev, 
                  status: "completed",
                  tasks: prev.tasks.map(t => ({ ...t, status: "completed" as const }))
                } : null)
              }
            } catch (e) {
              // Not valid JSON, might be partial - will be handled in next iteration
              console.log("Parse error for line:", line.substring(0, 100))
            }
          }
        }
        
        // Process any remaining buffer content
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer)
            if (data.type === "complete") receivedComplete = true
            if (data.type === "error") { receivedComplete = false; streamErrorMessage = typeof data.content === "string" ? data.content : "Generation failed." }
            if (data.type === "preview-error") setPreviewError(typeof data.content === "string" ? data.content : "AI generation failed.")
            if (data.type === "file-update") {
              console.log("Final file update:", data.file.path)
              const existingIndex = updatedFiles.findIndex(f => f.path === data.file.path)
              if (existingIndex >= 0) {
                updatedFiles[existingIndex] = { ...data.file, isModified: true }
              } else {
                updatedFiles.push({ ...data.file, isModified: true })
              }
              setFiles([...updatedFiles])
            }
          } catch (e) {
            // Ignore final parse errors
          }
        }
      }

      // Add assistant message; only show success/completed when stream sent "complete"
      const finalPlan: BuildPlan = {
        ...plan,
        status: receivedComplete ? "completed" : "failed",
        tasks: plan.tasks.map(t => ({ ...t, status: (receivedComplete ? "completed" : t.status) as Task["status"] }))
      }
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent || (receivedComplete ? "I've updated your project. Check the preview to see the changes!" : (streamErrorMessage ?? "Generation did not complete. See the error above.")),
        timestamp: new Date(),
        buildPlan: finalPlan
      }
      setMessages(prev => [...prev, assistantMessage])
      setPreviewReason(assistantContent?.trim() || null)
      if (receivedComplete) setPreviewError(null)
      if (receivedComplete) setGenerationCompleteAnnouncement("Generation complete.")

      if (receivedComplete) {
        // Save version only on successful completion
        const newVersion: ProjectVersion = {
          id: Date.now().toString(),
          name: `v${versions.length + 1}`,
          description: content.slice(0, 100),
          files: [...updatedFiles],
          createdAt: new Date(),
          isCurrent: true
        }
        setVersions(prev => [
          ...prev.map(v => ({ ...v, isCurrent: false })),
          newVersion
        ])
        toast.success("Generation complete!")
        setRightPanelTab("preview")
      } else {
        setCurrentPlan(prev => prev ? { ...prev, status: "failed" } : null)
        toast.error(assistantContent.slice(0, 80) || "Generation did not complete successfully.")
      }

    } catch (error) {
      console.error("Generation error:", error)
      const errMsg = error instanceof Error ? error.message : "Failed to generate. Please try again."
      toast.error(errMsg)
      
      setCurrentPlan(prev => prev ? { ...prev, status: "failed" } : null)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errMsg,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setPreviewReason(errMsg)
    } finally {
      setIsGenerating(false)
    }
  }, [files, messages, versions])

  // Restore version (from persisted or in-memory history)
  const handleRestoreVersion = useCallback((version: ProjectVersion) => {
    const filesWithModified = version.files.map(f => ({ ...f, isModified: true }))
    setFiles(filesWithModified)
    setSelectedFile(filesWithModified[0] ?? null)
    setVersions(prev => prev.map(v => ({
      ...v,
      isCurrent: v.id === version.id
    })))
    setPreviewError(null)
    setPreviewReason(null)
    toast.success(`Restored to ${version.name}`)
  }, [])

  // Handle fix error - sends error to chat for AI to fix and regenerate code
  const handleFixError = useCallback((errorMessage: string) => {
    // Get the current page code to include in the fix request
    const pageFile = files.find(f => f.path === "/app/page.tsx")
    const currentCode = pageFile?.content || ""
    
    // Create a detailed fix prompt that instructs AI to regenerate the code
    const fixPrompt = `🔧 **FIX CODE ERROR**

**Error Message:**
\`\`\`
${errorMessage}
\`\`\`

**Current Code with Error:**
\`\`\`tsx
${currentCode}
\`\`\`

**Instructions:**
1. Analyze the error message above
2. Find the exact line causing the syntax/runtime error
3. Fix the issue while keeping all existing functionality
4. Return the COMPLETE fixed code (not just the fix)
5. Make sure the code compiles and runs without errors

Please regenerate the entire page.tsx file with the fix applied.`

    handleSendMessage(fixPrompt)
    setLeftPanelTab("tasks") // Switch to tasks to show progress
    toast.info("AI is analyzing and fixing the error...")
  }, [handleSendMessage, files])

  // Retry last generation (used when assistant message has status failed)
  const handleRetry = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === "user")
    if (lastUser) handleSendMessage(lastUser.content)
  }, [messages, handleSendMessage])

  // Make it pop — one-click add wow element (gradient, animation, glassmorphism)
  const handleMakeItPop = useCallback(() => {
    handleSendMessage("Add a clear wow element: gradient text, keyframes animation, hover:scale, or glassmorphism. Keep the rest of the page the same.")
    setLeftPanelTab("chat")
    toast.info("Adding a wow element...")
  }, [handleSendMessage])

  // When preview reports an error, just surface it once; fixing is manual via the "Fix Error" button
  const handleAutoFixError = useCallback((errorMessage: string) => {
    const message = typeof errorMessage === "string" ? errorMessage : "Preview failed due to invalid code."
    console.error("[Builder Preview Error]", message)
    toast.error("Preview error", {
      description: message.slice(0, 200),
    })
  }, [])

  return (
    <div className="flex h-screen flex-col bg-transparent" aria-busy={isGenerating}>
      {generationCompleteAnnouncement && (
        <LiveRegion politeness="polite" role="status">
          {generationCompleteAnnouncement}
        </LiveRegion>
      )}
      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Mobile: stacked layout (left panel then preview/code) - each takes full device height */}
        <div className="block md:hidden flex flex-col">
          {/* Left Panel - Chat, Files, Tasks, History - Full device height */}
          <div className="flex flex-col h-screen overflow-hidden border-b">
            <div className="flex border-b overflow-x-auto shrink-0">
              <button
                onClick={() => setLeftPanelTab("chat")}
                className={cn(
                  "flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-2 min-h-[44px] px-2 py-2 text-xs sm:text-sm transition-colors whitespace-nowrap",
                  leftPanelTab === "chat" 
                    ? "border-b-2 border-[#e052a0] text-[#e052a0]" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Chat"
                aria-pressed={leftPanelTab === "chat"}
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Chat</span>
              </button>
              <button
                onClick={() => setLeftPanelTab("files")}
                className={cn(
                  "flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-2 min-h-[44px] px-2 py-2 text-xs sm:text-sm transition-colors whitespace-nowrap",
                  leftPanelTab === "files" 
                    ? "border-b-2 border-[#e052a0] text-[#e052a0]" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Files"
                aria-pressed={leftPanelTab === "files"}
              >
                <FolderTree className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Files</span>
              </button>
              <button
                onClick={() => setLeftPanelTab("tasks")}
                className={cn(
                  "flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-2 min-h-[44px] px-2 py-2 text-xs sm:text-sm transition-colors whitespace-nowrap",
                  leftPanelTab === "tasks" 
                    ? "border-b-2 border-[#e052a0] text-[#e052a0]" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Tasks"
                aria-pressed={leftPanelTab === "tasks"}
              >
                <ListTodo className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Tasks</span>
                {currentPlan && currentPlan.status === "executing" && (
                  <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setLeftPanelTab("history")}
                className={cn(
                  "flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-2 min-h-[44px] px-2 py-2 text-xs sm:text-sm transition-colors whitespace-nowrap",
                  leftPanelTab === "history" 
                    ? "border-b-2 border-[#e052a0] text-[#e052a0]" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Version history"
                aria-pressed={leftPanelTab === "history"}
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">History</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {leftPanelTab === "chat" && (
                <BuilderChat
                  messages={messages}
                  isGenerating={isGenerating}
                  onSendMessage={handleSendMessage}
                  onRetry={handleRetry}
                  currentCode={getPreviewCode()}
                  currentPlan={currentPlan}
                />
              )}
              {leftPanelTab === "files" && (
                <FileExplorer
                  files={files}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                />
              )}
              {leftPanelTab === "tasks" && (
                <TaskPanel plan={currentPlan} />
              )}
              {leftPanelTab === "history" && (
                <VersionHistory
                  versions={versions}
                  onRestore={handleRestoreVersion}
                />
              )}
            </div>
          </div>

          {/* Right Panel - Preview & Code (stacked below sidebar) - Full device height */}
          <div className="flex flex-col h-screen overflow-hidden border-t">
            <div className="flex items-center justify-between border-b px-2 sm:px-4 overflow-x-auto shrink-0">
              <div className="flex min-w-0">
                <button
                  onClick={() => setRightPanelTab("preview")}
                  className={cn(
                    "flex items-center gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-4 py-2 text-xs sm:text-sm transition-colors whitespace-nowrap",
                    rightPanelTab === "preview" 
                      ? "border-b-2 border-[#e052a0] text-[#e052a0]" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Preview"
                  aria-pressed={rightPanelTab === "preview"}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                <button
                  onClick={() => setRightPanelTab("code")}
                  className={cn(
                    "flex items-center gap-1 sm:gap-2 min-h-[44px] px-2 sm:px-4 py-2 text-xs sm:text-sm transition-colors whitespace-nowrap min-w-0",
                    rightPanelTab === "code" 
                      ? "border-b-2 border-[#e052a0] text-[#e052a0]" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Code"
                  aria-pressed={rightPanelTab === "code"}
                >
                  <Code className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Code</span>
                  {selectedFile && (
                    <span className="text-xs text-muted-foreground hidden lg:inline ml-1 truncate max-w-[100px]">
                      {selectedFile.name}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {isGenerating && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
                    <span className="hidden sm:inline">Generating...</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="min-h-[44px] min-w-[44px] h-9 w-9 sm:h-8 sm:w-8 p-0"
                  aria-label={isFullscreen ? "Exit fullscreen preview" : "Fullscreen preview"}
                >
                  <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] overflow-hidden">
              {rightPanelTab === "preview" && (
                <PreviewErrorBoundary onError={handleAutoFixError}>
                  <LivePreviewV2
                    code={getPreviewCode()}
                    viewport={viewport}
                    isFullscreen={isFullscreen}
                    files={previewAdditionalFiles}
                    reason={previewReason}
                    previewError={previewError}
                    onFixError={handleFixError}
                    onErrorDetected={handleAutoFixError}
                    onUseSafeStarter={handleUseSafeStarter}
                    onMakeItPop={handleMakeItPop}
                  />
                </PreviewErrorBoundary>
              )}
              {rightPanelTab === "code" && selectedFile && (
                <CodeEditor
                  file={selectedFile}
                  onChange={(content) => handleFileChange(selectedFile.id, content)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Sidebar and Preview/Code side-by-side, each full device height */}
        <div className="hidden md:block h-screen flex overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="gap-2 sm:gap-3">
            {/* Left Panel - AI Assistant/Task Management - Full device height */}
            <ResizablePanel defaultSize={33} minSize={20} maxSize={40} className="min-w-0 h-full">
              <div className="h-full p-2 sm:p-3">
                <div className="flex h-full flex-col rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Header: Nairi Logo */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1.5 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border-b border-white/20 bg-white/5 backdrop-blur-sm shrink-0">
                  <Link href="/nav" className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0">
                    <Image 
                      src="/images/nairi-logo-header.jpg" 
                      alt="Nairi" 
                      width={32} 
                      height={32} 
                      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg shrink-0" 
                    />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-lg bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent hidden sm:inline">
                      Nairi
                    </span>
                  </Link>
                  {/* Mobile Menu for Tabs */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground">
                          <Menu className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white/10 backdrop-blur-xl border border-white/20">
                        <DropdownMenuItem onClick={() => setLeftPanelTab("chat")} className={cn(leftPanelTab === "chat" && "bg-white/10")}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLeftPanelTab("tasks")} className={cn(leftPanelTab === "tasks" && "bg-white/10")}>
                          <ListTodo className="h-4 w-4 mr-2" />
                          Tasks
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLeftPanelTab("files")} className={cn(leftPanelTab === "files" && "bg-white/10")}>
                          <FolderTree className="h-4 w-4 mr-2" />
                          Files
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLeftPanelTab("history")} className={cn(leftPanelTab === "history" && "bg-white/10")}>
                          <History className="h-4 w-4 mr-2" />
                          History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Task Progress Section */}
                {currentPlan && (
                  <div className="px-1.5 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border-b border-white/20 bg-white/5 backdrop-blur-sm shrink-0">
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2 gap-1">
                      <span className="text-[10px] sm:text-xs md:text-sm font-medium text-foreground truncate min-w-0">
                        {currentPlan.tasks.filter(t => t.status !== "completed").length}/{currentPlan.tasks.length} Remaining
                      </span>
                      <div className="h-3.5 w-7 sm:h-4 sm:w-8 md:h-5 md:w-10 rounded-full bg-white/10 border border-white/20 relative cursor-pointer shrink-0">
                        <div className="absolute top-0.5 left-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 rounded-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] transition-transform" />
                      </div>
                    </div>
                    <div className="h-1 sm:h-1.5 md:h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] transition-all duration-500"
                        style={{ width: `${Math.round((currentPlan.tasks.filter(t => t.status === "completed").length / currentPlan.tasks.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}


                {/* Left Panel Tabs - Hidden on mobile, shown on sm+ */}
                <div className="hidden sm:flex border-b border-white/20 bg-white/5 backdrop-blur-sm overflow-x-auto shrink-0">
                  <button
                    onClick={() => setLeftPanelTab("chat")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 md:gap-1.5 lg:gap-2 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs transition-colors whitespace-nowrap min-w-0",
                      leftPanelTab === "chat"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="hidden md:inline">Chat</span>
                  </button>
                  <button
                    onClick={() => setLeftPanelTab("tasks")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 md:gap-1.5 lg:gap-2 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs transition-colors whitespace-nowrap min-w-0",
                      leftPanelTab === "tasks"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ListTodo className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="hidden md:inline">Tasks</span>
                  </button>
                  <button
                    onClick={() => setLeftPanelTab("files")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 md:gap-1.5 lg:gap-2 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs transition-colors whitespace-nowrap min-w-0",
                      leftPanelTab === "files"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FolderTree className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="hidden md:inline">Files</span>
                  </button>
                  <button
                    onClick={() => setLeftPanelTab("history")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 md:gap-1.5 lg:gap-2 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs transition-colors whitespace-nowrap min-w-0",
                      leftPanelTab === "history"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <History className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="hidden md:inline">History</span>
                  </button>
                </div>

                {/* Chat/Prompt Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {leftPanelTab === "chat" && (
                    <BuilderChat
                      messages={messages}
                      isGenerating={isGenerating}
                      onSendMessage={handleSendMessage}
                      onRetry={handleRetry}
                      currentCode={getPreviewCode()}
                      currentPlan={currentPlan}
                    />
                  )}
                  {leftPanelTab === "tasks" && (
                    <TaskPanel plan={currentPlan} />
                  )}
                  {leftPanelTab === "files" && (
                    <FileExplorer
                      files={files}
                      selectedFile={selectedFile}
                      onFileSelect={handleFileSelect}
                    />
                  )}
                  {leftPanelTab === "history" && (
                    <VersionHistory
                      versions={versions}
                      onRestore={handleRestoreVersion}
                    />
                  )}
                </div>
              </div>
            </div>
            </ResizablePanel>

            <div className="relative flex items-center justify-center w-3 group cursor-col-resize hover:w-4 transition-all duration-200">
              <ResizableHandle 
                withHandle={false}
                className="absolute inset-0 w-full bg-transparent"
              />
              {/* Main resize line */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/10 group-hover:bg-gradient-to-b group-hover:from-[#e052a0]/50 group-hover:via-transparent group-hover:to-[#00c9c8]/50 transition-all duration-200" />
              {/* Hover indicator dots */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/30 group-hover:bg-[#e052a0]/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/40 group-hover:bg-gradient-to-r group-hover:from-[#e052a0] group-hover:to-[#00c9c8] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg group-hover:shadow-[#e052a0]/30" />
              <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/30 group-hover:bg-[#00c9c8]/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>

            {/* Middle Panel - Preview & Code Editor - Full device height */}
            <ResizablePanel defaultSize={67} minSize={60} maxSize={80} className="min-w-0 h-full">
              <div className="h-full p-2 sm:p-3">
                <div className="flex h-full flex-col rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Preview/Code Tabs */}
              <div className="flex items-center justify-between border-b border-white/20 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center">
                  <button
                    onClick={() => setRightPanelTab("preview")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm transition-colors",
                      rightPanelTab === "preview"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0] bg-white/5"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => setRightPanelTab("code")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm transition-colors",
                      rightPanelTab === "code"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0] bg-white/5"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code className="h-4 w-4" />
                    Code
                  </button>
                  <button
                    onClick={() => setRightPanelTab("tools")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm transition-colors",
                      rightPanelTab === "tools"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0] bg-white/5"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Wrench className="h-4 w-4" />
                    Web Browser Tools
                  </button>
                  <button
                    onClick={() => setRightPanelTab("cli")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm transition-colors",
                      rightPanelTab === "cli"
                        ? "border-b-2 border-[#e052a0] text-[#e052a0] bg-white/5"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Terminal className="h-4 w-4" />
                    CLI
                  </button>
                </div>
                <div className="flex items-center gap-2 px-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveProject}
                    disabled={isSavingProject}
                    className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20"
                  >
                    {isSavingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                </div>
              </div>

              {/* URL Bar & Browser Controls */}
              {rightPanelTab === "preview" && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/20 bg-white/5 backdrop-blur-sm">
                  <input
                    type="text"
                    value={`http://www.${(currentProjectName.trim() || "project").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "project"}.nairi.ai`}
                    readOnly
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md text-sm text-foreground"
                  />
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-white/10">
                      <MousePointer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-white/10">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-white/10">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center rounded-lg border border-white/20 p-0.5">
                      <Button
                        variant={viewport === "desktop" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewport("desktop")}
                      >
                        <Monitor className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={viewport === "tablet" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewport("tablet")}
                      >
                        <Tablet className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={viewport === "mobile" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewport("mobile")}
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview/Code/Tools/CLI Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelTab === "preview" && (
                  <PreviewErrorBoundary onError={handleAutoFixError}>
                    <LivePreviewV2
                      code={getPreviewCode()}
                      viewport={viewport}
                      isFullscreen={isFullscreen}
                      files={previewAdditionalFiles}
                      reason={previewReason}
                      previewError={previewError}
                      onFixError={handleFixError}
                      onErrorDetected={handleAutoFixError}
                      onUseSafeStarter={handleUseSafeStarter}
                      onMakeItPop={handleMakeItPop}
                    />
                  </PreviewErrorBoundary>
                )}
                {rightPanelTab === "code" && selectedFile && (
                  <CodeEditor
                    file={selectedFile}
                    onChange={(content) => handleFileChange(selectedFile.id, content)}
                  />
                )}
                {rightPanelTab === "tools" && (
                  <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto p-4 font-mono text-xs text-foreground/80 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:rounded-full scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-white/10 hover:scrollbar-track-transparent">
                    <div className="space-y-1">
                      <div className="text-[#e052a0]">Document</div>
                      <div className="pl-4 text-[#00c9c8]">Head</div>
                      <div className="pl-8 text-muted-foreground">&lt;link&gt;</div>
                      <div className="pl-8 text-muted-foreground">&lt;meta&gt;</div>
                      <div className="pl-8 text-muted-foreground">&lt;script&gt;</div>
                      <div className="pl-4 text-[#00c9c8]">Body</div>
                      <div className="pl-8 text-foreground">&lt;div&gt;</div>
                      <div className="pl-12 text-muted-foreground">console.log</div>
                    </div>
                  </div>
                )}
                {rightPanelTab === "cli" && (
                  <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto p-4 font-mono text-xs text-foreground/80 bg-black/20 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:rounded-full scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-white/10 hover:scrollbar-track-transparent">
                    <div className="space-y-1">
                      <div className="text-green-400">✓ Ready in 14.6s</div>
                      <div className="text-yellow-400">⚠ Found a change in next.config.mjs</div>
                      <div className="text-muted-foreground">Restarting the server...</div>
                      <div className="text-foreground">▲ Next.js 16.1.6 (Turbopack)</div>
                      <div className="text-muted-foreground">- Local: http://localhost:3000</div>
                      <div className="text-muted-foreground">- Network: http://10.5.0.2:3000</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  )
}
