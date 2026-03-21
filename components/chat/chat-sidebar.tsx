"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, MessageSquare, Home, Trash2, Menu, Search, Pin, PinOff, Download, FolderOpen, FolderPlus, Pencil, MoreVertical, Share2, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/context"

const CONVERSATIONS_REFRESH_EVENT = "chat:conversations-refresh"
const CONVERSATION_CREATED_EVENT = "chat:conversation-created"

interface Conversation {
  id: string
  title: string
  updated_at: string
  is_pinned?: boolean
  pinned_at?: string | null
  folder_id?: string | null
}

interface Project {
  id: string
  name: string
}

export function ChatSidebar({
  conversations: initialConversations,
  projects: initialProjects = [],
  userId,
}: {
  conversations: Conversation[]
  projects?: Project[]
  userId: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = useState("")
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingConvTitle, setEditingConvTitle] = useState("")
  const [newConvIds, setNewConvIds] = useState<Set<string>>(new Set())
  const { t } = useTranslation()

  // Sync from server when layout re-renders; merge so we don't lose optimistically added new conversations
  useEffect(() => {
    setConversations((prev) => {
      const serverIds = new Set(initialConversations.map((c) => c.id))
      const onlyInClient = prev.filter((c) => !serverIds.has(c.id))
      return onlyInClient.length > 0 ? [...onlyInClient, ...initialConversations] : initialConversations
    })
  }, [initialConversations])

  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  const refetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/folders", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const list = data?.folders ?? []
        setProjects(Array.isArray(list) ? list : [])
      }
    } catch {
      // keep current list
    }
  }, [])

  const refetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setConversations(Array.isArray(data) ? data : [])
      }
    } catch {
      // keep current list on error
    }
  }, [])

  useEffect(() => {
    const handler = () => refetchConversations()
    window.addEventListener(CONVERSATIONS_REFRESH_EVENT, handler)
    return () => window.removeEventListener(CONVERSATIONS_REFRESH_EVENT, handler)
  }, [refetchConversations])

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>)?.detail?.id
      if (!id) return
      setNewConvIds((prev) => new Set(prev).add(id))
      setConversations((prev) => {
        if (prev.some((c) => c.id === id)) return prev
        const newConv: Conversation = {
          id,
          title: "New Conversation",
          updated_at: new Date().toISOString(),
          is_pinned: false,
          pinned_at: undefined,
          folder_id: activeProjectId,
        }
        return [newConv, ...prev]
      })
      setTimeout(() => setNewConvIds((prev) => { const n = new Set(prev); n.delete(id); return n }), 800)
    }
    window.addEventListener(CONVERSATION_CREATED_EVENT, handler)
    return () => window.removeEventListener(CONVERSATION_CREATED_EVENT, handler)
  }, [activeProjectId])

  // Filter by project and search, then separate pinned
  const { pinnedConversations, regularConversations } = useMemo(() => {
    let filtered = conversations
    if (activeProjectId !== null) {
      filtered = filtered.filter((c) => (c.folder_id ?? null) === activeProjectId)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((conv) =>
        conv.title.toLowerCase().includes(query)
      )
    }
    const pinned = filtered.filter((conv) => conv.is_pinned)
    const regular = filtered.filter((conv) => !conv.is_pinned)
    return { pinnedConversations: pinned, regularConversations: regular }
  }, [conversations, searchQuery, activeProjectId])

  const pinConversation = async (id: string, isPinned: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: isPinned }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error ?? "Could not update conversation")
        return
      }
      router.refresh()
    } catch {
      toast.error("Could not update conversation")
    }
  }

  const createNewConversation = async () => {
    setIsCreating(true)
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: activeProjectId ?? null }),
      })
      const contentType = res.headers.get("content-type") ?? ""
      const body = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : {}
      if (!res.ok) {
        const msg = body?.error ?? res.statusText ?? "Could not start chat. Please try again or sign in."
        toast.error(msg)
        return
      }
      const id = body?.id
      if (id) {
        setIsOpen(false)
        setNewConvIds((prev) => new Set(prev).add(id))
        setConversations((prev) => {
          if (prev.some((c) => c.id === id)) return prev
          const newConv: Conversation = {
            id,
            title: "New Conversation",
            updated_at: new Date().toISOString(),
            is_pinned: false,
            pinned_at: undefined,
            folder_id: activeProjectId ?? null,
          }
          return [newConv, ...prev]
        })
        setTimeout(() => setNewConvIds((p) => { const n = new Set(p); n.delete(id); return n }), 800)
        router.push(`/chat/${id}`)
        router.refresh()
      } else {
        toast.error("Could not start chat. Please try again.")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("[ChatSidebar] createNewConversation error:", msg, err)
      toast.error("Could not start chat. Please try again or sign in.")
    } finally {
      setIsCreating(false)
    }
  }

  const createProject = async () => {
    const name = newProjectName.trim() || "New project"
    setIsCreatingProject(true)
    try {
      const res = await fetch("/api/chat/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error ?? "Could not create project")
        return
      }
      const data = await res.json()
      const id = data?.id
      if (id) {
        setProjects((prev) => [...prev, { id, name }])
        setNewProjectOpen(false)
        setNewProjectName("")
        setActiveProjectId(id)
        toast.success("Project created")
      }
    } catch {
      toast.error("Could not create project")
    } finally {
      setIsCreatingProject(false)
    }
  }

  const renameProject = async () => {
    if (!editingProjectId) return
    const name = editingProjectName.trim()
    if (!name) return
    try {
      const res = await fetch(`/api/chat/folders/${editingProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        toast.error("Could not rename project")
        return
      }
      setProjects((prev) => prev.map((p) => (p.id === editingProjectId ? { ...p, name } : p)))
      setEditingProjectId(null)
      setEditingProjectName("")
      toast.success("Project renamed")
    } catch {
      toast.error("Could not rename project")
    }
  }

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/chat/folders/${projectId}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Could not delete project")
        return
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      if (activeProjectId === projectId) setActiveProjectId(null)
      router.refresh()
      toast.success("Project deleted")
    } catch {
      toast.error("Could not delete project")
    }
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error ?? "Could not delete conversation")
        return
      }
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (pathname === `/chat/${id}`) {
        router.push("/chat")
      }
      router.refresh()
    } catch {
      toast.error("Could not delete conversation")
    }
  }

  const renameConversation = async (id: string, title: string) => {
    if (!title.trim()) return
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim().slice(0, 255) }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error ?? "Could not rename")
        return
      }
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: title.trim().slice(0, 255) } : c)))
      setEditingConvId(null)
      setEditingConvTitle("")
      router.refresh()
      toast.success("Renamed")
    } catch {
      toast.error("Could not rename")
    }
  }

  const shareConversation = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = typeof window !== "undefined" ? `${window.location.origin}/chat/${id}` : ""
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    } else {
      toast.error("Could not copy link")
    }
  }

  const exportConversation = async (convId: string, format: "txt" | "md" | "json") => {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, format }),
      })
      if (!res.ok) {
        toast.error("Export failed")
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nairi-chat-${convId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch {
      toast.error("Export failed")
    }
  }

  return (
    <>
      {/* Mobile menu button — only when sidebar is closed; no close button (close via overlay) */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 h-12 w-12 min-h-[44px] min-w-[44px] lg:hidden"
          onClick={() => setIsOpen(true)}
          aria-label={t.chat.sidebarOpenMenu}
          aria-expanded={false}
          aria-controls="chat-sidebar"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Overlay - z-30 so sidebar (z-40) is on top and receives taps */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} aria-hidden />}

      {/* Sidebar - glassmorphism, rounded, z-40 above overlay on mobile */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 max-w-[85vw] lg:max-w-none flex flex-col transition-transform duration-300 ease-out rounded-2xl lg:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl lg:min-h-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-modal={isOpen}
        aria-label={t.chat.conversations}
        id="chat-sidebar"
      >
        <div className="p-4 pl-16 lg:pl-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <Link href="/nav" className="flex items-center gap-2 min-w-0">
              <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={32} height={32} className="rounded-lg backdrop-blur-sm border border-white/20 shadow-lg" />
              <span className="text-lg font-bold bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent">
                Nairi
              </span>
            </Link>
            <Button asChild variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-foreground bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-full shadow-lg" aria-label={t.chat.sidebarGoToDashboard}>
              <Link href="/dashboard">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <Button
            type="button"
            onClick={createNewConversation}
            disabled={isCreating}
            className="w-full min-h-[44px] sm:min-h-0 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90 cursor-pointer touch-manipulation rounded-xl font-medium shadow-lg shadow-pink-500/20"
            aria-label={isCreating ? t.chat.sidebarCreatingNewChat : t.chat.sidebarStartNewChat}
          >
            <Plus className="h-4 w-4 mr-2 shrink-0" />
            {isCreating ? t.chat.sidebarCreating : t.chat.sidebarNewChat}
          </Button>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
            <Input
              type="search"
              placeholder={t.chat.sidebarSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/10 border-white/20 backdrop-blur-md min-h-[44px] sm:min-h-9 touch-manipulation rounded-xl text-foreground placeholder:text-muted-foreground shadow-lg"
              aria-label={t.chat.sidebarSearchPlaceholder}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {pinnedConversations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Pin className="h-3 w-3" />
                {t.chat.sidebarPinned}
              </h3>
              <div className="space-y-1">
                {pinnedConversations.map((conv, index) => (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    onClick={() => setIsOpen(false)}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 min-h-[44px] sm:min-h-0 rounded-xl text-sm transition-colors group touch-manipulation border-l-2 border-[#e052a0]",
                      pathname === `/chat/${conv.id}`
                        ? "bg-[#e052a0]/20 backdrop-blur-md border border-white/20 text-foreground shadow-lg"
                        : "text-muted-foreground bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20",
                      newConvIds.has(conv.id) && "animate-in fade-in slide-in-from-top-2 duration-300",
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1 min-w-0">{conv.title}</span>
                    <div className="flex items-center gap-0.5 shrink-0 ml-auto opacity-70 group-hover:opacity-100">
                      <button type="button" onClick={(e) => pinConversation(conv.id, false, e)} className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 touch-manipulation shadow-lg" title={t.chat.sidebarUnpin} aria-label={t.chat.sidebarUnpin}><PinOff className="h-3.5 w-3.5" /></button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation() }} className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 touch-manipulation shadow-lg" title={t.chat.sidebarEdit} aria-label={t.chat.sidebarMoreOptions}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingConvId(conv.id); setEditingConvTitle(conv.title) }} className="cursor-pointer gap-2"><Pencil className="h-3.5 w-3.5" /> {t.chat.sidebarEdit}</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => shareConversation(conv.id, e)} className="cursor-pointer gap-2"><Share2 className="h-3.5 w-3.5" /> {t.chat.sidebarShare}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id, e) }} className="cursor-pointer gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> {t.chat.sidebarDelete}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.chat.sidebarHistory}</h3>
            <div className="space-y-1">
              {regularConversations.length > 0 ? (
                regularConversations.map((conv, index) => (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    onClick={() => setIsOpen(false)}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 min-h-[44px] sm:min-h-0 rounded-xl text-sm transition-colors group touch-manipulation",
                      pathname === `/chat/${conv.id}`
                        ? "bg-[#e052a0]/20 backdrop-blur-md border border-white/20 text-foreground shadow-lg"
                        : "text-muted-foreground bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20",
                      newConvIds.has(conv.id) && "animate-in fade-in slide-in-from-top-2 duration-300",
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1 min-w-0">{conv.title}</span>
                    <div className="flex items-center gap-0.5 shrink-0 ml-auto opacity-70 group-hover:opacity-100">
                      <button type="button" onClick={(e) => pinConversation(conv.id, true, e)} className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 touch-manipulation shadow-lg" title={t.chat.sidebarPin} aria-label={t.chat.sidebarPin}><Pin className="h-3.5 w-3.5" /></button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation() }} className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 touch-manipulation shadow-lg" title={t.chat.sidebarEdit} aria-label={t.chat.sidebarMoreOptions}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingConvId(conv.id); setEditingConvTitle(conv.title) }} className="cursor-pointer gap-2"><Pencil className="h-3.5 w-3.5" /> {t.chat.sidebarEdit}</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => shareConversation(conv.id, e)} className="cursor-pointer gap-2"><Share2 className="h-3.5 w-3.5" /> {t.chat.sidebarShare}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id, e) }} className="cursor-pointer gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> {t.chat.sidebarDelete}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  {searchQuery ? t.chat.sidebarNoMatching : t.chat.sidebarNoConversations}
                </p>
              )}
            </div>
          </div>

          {/* Projects section - ChatGPT style */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                {t.chat.sidebarProjects}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground shadow-lg"
                onClick={() => setNewProjectOpen(true)}
                aria-label={t.chat.sidebarNewProject}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setActiveProjectId(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors touch-manipulation",
                  activeProjectId === null ? "bg-[#e052a0]/20 backdrop-blur-md border border-white/20 text-foreground shadow-lg" : "text-muted-foreground bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20",
                )}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.chat.sidebarAll}</span>
              </button>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors group touch-manipulation",
                    activeProjectId === project.id ? "bg-[#e052a0]/20 backdrop-blur-md border border-white/20 text-foreground shadow-lg" : "text-muted-foreground bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveProjectId(project.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); setEditingProjectName(project.name) }}
                      className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 touch-manipulation shadow-lg"
                      title={t.chat.sidebarRenameProject}
                      aria-label={t.chat.sidebarRenameProject}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deleteProject(project.id, e)}
                      className="p-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-destructive touch-manipulation shadow-lg"
                      title={t.chat.sidebarDelete}
                      aria-label={t.chat.sidebarDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">{t.chat.sidebarNoProjects}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm shrink-0">
          <Button asChild variant="outline" className="w-full min-h-[44px] sm:min-h-9 bg-white/10 border-white/20 backdrop-blur-md text-foreground hover:bg-white/20 touch-manipulation rounded-xl shadow-lg gap-2" aria-label={t.chat.sidebarBrowseMarketplace}>
            <Link href="/marketplace" className="inline-flex items-center justify-center gap-2">
              <Store className="h-4 w-4 shrink-0" />
              {t.chat.sidebarBrowseMarketplace}
            </Link>
          </Button>
        </div>
      </aside>

      {/* New project dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{t.chat.sidebarNewProject}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t.chat.sidebarProjectName}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createProject()}
            className="bg-white/5 border-white/10 rounded-xl"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewProjectOpen(false)} className="bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20">{t.common.cancel}</Button>
            <Button onClick={createProject} disabled={isCreatingProject} className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
              {isCreatingProject ? t.chat.sidebarCreating : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename project dialog */}
      <Dialog open={editingProjectId !== null} onOpenChange={(open) => !open && setEditingProjectId(null)}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{t.chat.sidebarRenameProject}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t.chat.sidebarProjectName}
            value={editingProjectName}
            onChange={(e) => setEditingProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && renameProject()}
            className="bg-white/5 border-white/10 rounded-xl"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditingProjectId(null); setEditingProjectName("") }} className="bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20">{t.common.cancel}</Button>
            <Button onClick={renameProject} className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename conversation dialog */}
      <Dialog open={editingConvId !== null} onOpenChange={(open) => !open && (setEditingConvId(null), setEditingConvTitle(""))}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{t.chat.sidebarRenameConversation}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t.chat.sidebarConversationTitle}
            value={editingConvTitle}
            onChange={(e) => setEditingConvTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && editingConvId && renameConversation(editingConvId, editingConvTitle)}
            className="bg-white/5 border-white/10 rounded-xl"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditingConvId(null); setEditingConvTitle("") }} className="bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20">{t.common.cancel}</Button>
            <Button onClick={() => editingConvId && renameConversation(editingConvId, editingConvTitle)} className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
