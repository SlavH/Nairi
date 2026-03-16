"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LiveRegion } from "@/components/ui/live-region"
import { PromptSuggestions } from "./prompt-suggestions"
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Code,
  FileCode,
  Wand2,
  Zap,
  Palette,
  Layout,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage, BuildPlan, Task } from "@/lib/builder-v2/types"

interface BuilderChatProps {
  messages: ChatMessage[]
  isGenerating: boolean
  onSendMessage: (content: string, attachments?: ChatMessage["attachments"]) => void
  /** When generation failed, call to retry with the last user message */
  onRetry?: () => void
  currentCode?: string
  /** Current build plan — used to show live task during generation */
  currentPlan?: { tasks: { id: string; title: string; status: string }[] } | null
}

const MAKE_IT_POP_PROMPT = "Add a clear wow element: gradient text, keyframes animation, hover:scale, or glassmorphism. Keep the rest of the page the same."

export function BuilderChat({ messages, isGenerating, onSendMessage, onRetry, currentCode = "", currentPlan = null }: BuilderChatProps) {
  const [input, setInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [showBuiltMoment, setShowBuiltMoment] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wasGeneratingRef = useRef(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Success moment: when generation just finished, show brief "Built!" then clear
  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating && messages.some(m => m.role === "assistant")) {
      setShowBuiltMoment(true)
      const t = setTimeout(() => setShowBuiltMoment(false), 2200)
      return () => clearTimeout(t)
    }
    wasGeneratingRef.current = isGenerating
  }, [isGenerating, messages])

  // Keyboard: Cmd+K / Ctrl+K focus prompt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        textareaRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!input.trim() || isGenerating) return
    onSendMessage(input.trim())
    setInput("")
  }, [input, isGenerating, onSendMessage])

  // Handle key press — Enter to send, Ctrl/Cmd+Enter to send, Shift+Enter for new line
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file upload logic here
  }, [])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }, [])

  // Render task status icon
  const renderTaskStatus = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Dynamic Prompt Suggestions - Above the chat */}
      <PromptSuggestions
        currentCode={currentCode}
        onSelectSuggestion={handleSuggestionSelect}
        isGenerating={isGenerating}
      />
      
      {/* Messages */}
      <div 
        className="flex-1 overflow-hidden p-2 sm:p-3 md:p-4 flex flex-col min-h-0" 
        ref={scrollRef}
      >
        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:rounded-full scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-white/10 hover:scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-56 sm:pt-60 md:pt-64 lg:pt-72 pb-3 sm:pb-4 md:pb-6 lg:pb-10 px-1 sm:px-2 md:px-3 lg:px-4 text-center h-full min-h-0 w-full max-w-full overflow-x-hidden">
              <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-5 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 ring-4 ring-violet-500/10 shrink-0">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 text-white" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent break-words px-1 w-full max-w-full">
                Build something amazing
              </h2>
              <p className="mt-1.5 sm:mt-2 md:mt-3 text-[10px] sm:text-xs md:text-sm text-muted-foreground max-w-full w-full px-1 sm:px-2 break-words" style={{ overflowWrap: 'anywhere' }}>
                Describe any website in plain English. I'll generate production-ready React + Tailwind code with animations, gradients, and modern UI—in seconds.
              </p>
              
              <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 space-y-2 sm:space-y-3 md:space-y-4 w-full max-w-full px-1 sm:px-2">
                <p className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider break-words">Try one of these:</p>
                <div className="grid gap-1 sm:gap-1.5 md:gap-2 w-full">
                  {[
                    { icon: <Layout className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 shrink-0" />, text: "Create a stunning portfolio with project showcase" },
                    { icon: <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 shrink-0" />, text: "Build a SaaS landing page with glassmorphism" },
                    { icon: <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 shrink-0" />, text: "Design an e-commerce page with animations" },
                    { icon: <Wand2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 shrink-0" />, text: "Clone YouTube homepage with dark theme" },
                  ].map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-1.5 sm:py-2 md:py-2.5 px-1.5 sm:px-2 md:px-3 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all group text-[10px] sm:text-xs w-full min-w-0 overflow-hidden"
                      onClick={() => setInput(suggestion.text)}
                    >
                      <span className="text-violet-500 mr-1 sm:mr-1.5 md:mr-2 group-hover:scale-110 transition-transform shrink-0 flex-shrink-0">{suggestion.icon}</span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs truncate text-left flex-1 min-w-0">{suggestion.text}</span>
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 justify-center pt-1 sm:pt-2 w-full max-w-full">
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs bg-violet-500/10 text-violet-600 border-violet-500/20 shrink-0">
                    <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5 sm:mr-1 shrink-0" />
                    <span className="whitespace-nowrap">AI-Powered</span>
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs shrink-0">
                    <Zap className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5 sm:mr-1 shrink-0" />
                    <span className="whitespace-nowrap">Animations</span>
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs shrink-0">
                    <Palette className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5 sm:mr-1 shrink-0" />
                    <span className="whitespace-nowrap">Modern UI</span>
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[85%] rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>

                {/* Build Plan Display */}
                {message.buildPlan && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <FileCode className="h-3 w-3" />
                      Build Plan
                    </div>
                    <div className="space-y-1">
                      {message.buildPlan.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          {renderTaskStatus(task.status)}
                          <span className={cn(
                            task.status === "completed" && "text-muted-foreground line-through"
                          )}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    {message.buildPlan.status === "failed" && onRetry && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={onRetry}
                          aria-label="Retry generation"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Code Changes */}
                {message.codeChanges && message.codeChanges.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Code className="h-3 w-3" />
                      Files Modified
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {message.codeChanges.map((change, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {change.file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <span className="mt-1 block text-xs opacity-50">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Success moment — brief "Built!" after generation completes */}
          {showBuiltMoment && !isGenerating && (
            <div className="flex justify-center py-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 text-sm font-medium border border-emerald-500/20 animate-in fade-in zoom-in-95 duration-300">
                <CheckCircle2 className="h-4 w-4" />
                Built! Check the preview →
              </div>
            </div>
          )}

          {/* Generating indicator — show live task when available */}
          {isGenerating && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 rounded-lg bg-muted/80 border border-border/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                  <span className="text-sm font-medium">
                    {currentPlan?.tasks?.find(t => t.status === "in-progress")?.title ?? "Creating your website..."}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Designing something beautiful. Usually 10–30 seconds.
                </p>
              </div>
            </div>
          )}

          {/* ARIA Live Regions for Screen Readers */}
          {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
            <LiveRegion politeness="polite" role="log">
              Builder: {messages[messages.length - 1].content.substring(0, 200)}
              {messages[messages.length - 1].content.length > 200 ? "..." : ""}
            </LiveRegion>
          )}

          {isGenerating && (
            <LiveRegion politeness="polite" role="status">
              Creating your website, please wait...
            </LiveRegion>
          )}
        </div>
      </div>

      {/* Prompt Input Area - matching image design */}
      <div
        className={cn(
          "border-t border-white/20 p-2 sm:p-3 md:p-4 bg-white/5 backdrop-blur-sm transition-colors shrink-0",
          isDragging && "bg-primary/5 border-primary"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            aria-label="Attach file"
          >
            <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Prompt"
            aria-label="Builder chat message input"
            className="flex-1 min-h-[44px] sm:min-h-[50px] max-h-[100px] sm:max-h-[120px] resize-none pr-10 sm:pr-12 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#e052a0]/50"
            disabled={isGenerating}
          />
          <Button
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            aria-label="Send message"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
