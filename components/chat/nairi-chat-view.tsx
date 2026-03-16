"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { useNairiChat, type NairiConnectionState, type NairiChatMessage } from "@/hooks/use-nairi-chat"
import { BotIcon as Bot, UserIcon as User, Loader2Icon as Loader2, RotateCcwIcon as RotateCcw, ExternalLinkIcon as ExternalLink } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const CONNECTION_LABELS: Record<NairiConnectionState, string> = {
  online: "Online",
  waking_up: "Waking up Nairi…",
  searching_web: "Searching web…",
  generating: "Generating…",
  error: "Connection error",
}

export function NairiChatView() {
  const {
    messages,
    connectionState,
    errorMessage,
    sendMessage,
    retry,
    clearError,
    isSending,
  } = useNairiChat({ maxTokens: 200 })
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: "smooth" })
  }, [])
  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const t = inputValue.trim()
      if (!t || isSending) return
      sendMessage(t)
      setInputValue("")
    },
    [inputValue, isSending, sendMessage]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Connection status */}
      <div className="shrink-0 px-4 py-2 border-b border-white/20 bg-white/5 flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-medium",
            connectionState === "online" && "text-green-600 dark:text-green-400",
            connectionState === "waking_up" && "text-amber-600 dark:text-amber-400",
            (connectionState === "searching_web" || connectionState === "generating") && "text-blue-600 dark:text-blue-400",
            connectionState === "error" && "text-destructive"
          )}
        >
          {(connectionState === "waking_up" || connectionState === "searching_web" || connectionState === "generating") && (
            <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
          )}
          {CONNECTION_LABELS[connectionState]}
        </span>
        {errorMessage && (
          <Button type="button" variant="ghost" size="sm" onClick={clearError} className="text-xs h-7">
            Dismiss
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl bg-gradient-to-br from-[#e052a0] to-[#00c9c8]">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Nairi / Наири</h2>
              <p className="text-muted-foreground text-sm">Chat with Nairi. Send a message to start.</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id ?? message.content.slice(0, 20)}
            message={message}
            isSending={isSending}
            connectionState={connectionState}
          />
        ))}

        {errorMessage && (
          <div className="text-center space-y-2 max-w-md mx-auto">
            <div className="text-sm text-destructive bg-white/10 border border-white/20 backdrop-blur-md rounded-lg p-3">
              {errorMessage}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retry}
              className="gap-2 min-h-[44px] bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20"
              aria-label="Retry"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t border-white/20 bg-white/5 backdrop-blur-xl p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative z-10 flex gap-2">
            <Textarea
              aria-label="Chat message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Nairi…"
              rows={1}
              className="min-h-[44px] resize-none bg-white/10 border border-white/20 backdrop-blur-md"
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="shrink-0 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90 min-h-[44px]"
              aria-label="Send"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isSending,
  connectionState,
}: {
  message: NairiChatMessage
  isSending: boolean
  connectionState: NairiConnectionState
}) {
  const isUser = message.role === "user"
  const isLoading = message.isPlaceholder && isSending

  return (
    <div
      className={cn(
        "flex gap-3 transition-opacity duration-200",
        isUser ? "ml-auto flex-row-reverse max-w-3xl" : "max-w-4xl"
      )}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8]" : "bg-gradient-to-r from-[#00c9c8] to-[#4fd1c5]"
        )}
      >
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>
      <div className={cn("flex flex-col gap-2 min-w-0", isUser ? "w-fit max-w-3xl items-end" : "flex-1")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 overflow-visible",
            isUser
              ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white w-fit max-w-full"
              : message.isError
                ? "bg-destructive/20 border border-destructive/40 text-destructive"
                : "bg-white/10 border border-white/20 backdrop-blur-md"
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {connectionState === "searching_web" ? "Searching web…" : "Generating…"}
            </span>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content || "—"}</p>
          )}
        </div>
        {!isUser && message.latency_sec != null && message.content && (
          <span className="text-xs text-muted-foreground">{message.latency_sec.toFixed(2)}s</span>
        )}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Sources</p>
            <ul className="space-y-1.5 text-xs">
              {message.sources.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 break-all"
                  >
                    [{s.id}] {s.title || s.url}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
