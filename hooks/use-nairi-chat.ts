"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { healthCheck, sendNairiChat } from "@/lib/api/nairi-client"
import type { NairiMessage } from "@/lib/nairi-api/types"
import type { NairiChatSource, NairiChatMeta } from "@/lib/api/nairi-client"

const MAX_HISTORY_MESSAGES = 20
const HEALTH_RETRIES = 2
const HEALTH_BACKOFF_MS = [3000, 6000]
const CHAT_RETRY_DELAY_MS = 2000

export type NairiConnectionState = "online" | "waking_up" | "searching_web" | "generating" | "error"

export interface NairiChatMessage {
  role: "user" | "assistant"
  content: string
  latency_sec?: number
  isError?: boolean
  isPlaceholder?: boolean
  id?: string
  sources?: NairiChatSource[]
  meta?: NairiChatMeta
}

export interface UseNairiChatOptions {
  maxTokens?: number
  initialMessages?: NairiChatMessage[]
}

export interface UseNairiChatReturn {
  messages: NairiChatMessage[]
  connectionState: NairiConnectionState
  errorMessage: string | null
  sendMessage: (content: string) => Promise<void>
  retry: () => void
  clearError: () => void
  isSending: boolean
}

function generateId(): string {
  return `nairi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Nairi chat hook: health check before send, wake-up retries, chat retry, single-flight.
 */
export function useNairiChat(options: UseNairiChatOptions = {}): UseNairiChatReturn {
  const { maxTokens = 200, initialMessages = [] } = options
  const [messages, setMessages] = useState<NairiChatMessage[]>(initialMessages)
  const [connectionState, setConnectionState] = useState<NairiConnectionState>("online")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const inFlightRef = useRef(false)
  const messagesRef = useRef<NairiChatMessage[]>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const clearError = useCallback(() => setErrorMessage(null), [])

  const ensureHealthy = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt <= HEALTH_RETRIES; attempt++) {
      try {
        const result = await healthCheck()
        if (result.ok) return true
      } catch {
        // ignore
      }
      if (attempt < HEALTH_RETRIES) {
        setConnectionState("waking_up")
        await new Promise((r) => setTimeout(r, HEALTH_BACKOFF_MS[attempt]))
      }
    }
    return false
  }, [])

  const doSend = useCallback(
    async (userContent: string) => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      setIsSending(true)
      setErrorMessage(null)

      const userMsg: NairiChatMessage = { role: "user", content: userContent, id: generateId() }
      setMessages((prev) => [...prev, userMsg])

      const loadingId = generateId()
      setMessages((prev) => [...prev, { role: "assistant", content: "", id: loadingId, isPlaceholder: true }])

      const replaceLoading = (replacement: NairiChatMessage) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId ? { ...replacement, id: loadingId, isPlaceholder: false } : m
          )
        )
      }

      const searchToGenTimerRef = { current: null as ReturnType<typeof setTimeout> | null }
      try {
        setConnectionState("searching_web")
        searchToGenTimerRef.current = setTimeout(() => {
          setConnectionState((s) => (s === "searching_web" ? "generating" : s))
        }, 2000)

        const healthy = await ensureHealthy()
        if (!healthy) {
          setConnectionState("error")
          setErrorMessage("Nairi is waking up. Please try again in a moment.")
          replaceLoading({
            role: "assistant",
            content: "Nairi is waking up. Please try again in a moment.",
            isError: true,
          })
          return
        }
        setConnectionState("generating")

        const history = messagesRef.current
          .filter((m) => m.role === "user" || m.role === "assistant")
          .slice(-MAX_HISTORY_MESSAGES)
        const apiMessages: NairiMessage[] = [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: userContent },
        ]

        const reqMaxTokens = typeof maxTokens === "number" && maxTokens > 0 ? maxTokens : 400
        let lastErr: Error | null = null
        for (let attempt = 0; attempt <= 1; attempt++) {
          try {
            const { response, sources, meta } = await sendNairiChat(apiMessages, reqMaxTokens)
            const answerMs = meta?.answer_ms != null ? meta.answer_ms / 1000 : undefined
            replaceLoading({
              role: "assistant",
              content: response,
              latency_sec: answerMs,
              sources: sources ?? [],
              meta,
            })
            setConnectionState("online")
            return
          } catch (e) {
            lastErr = e instanceof Error ? e : new Error(String(e))
            if (attempt === 0) await new Promise((r) => setTimeout(r, CHAT_RETRY_DELAY_MS))
          }
        }

        setConnectionState("error")
        const msg = lastErr?.message ?? "Request failed"
        setErrorMessage(msg)
        replaceLoading({
          role: "assistant",
          content: msg,
          isError: true,
        })
      } finally {
        if (searchToGenTimerRef.current) clearTimeout(searchToGenTimerRef.current)
        inFlightRef.current = false
        setIsSending(false)
      }
    },
    [maxTokens, ensureHealthy]
  )

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content?.trim()
      if (!trimmed || isSending) return
      await doSend(trimmed)
    },
    [isSending, doSend]
  )

  const retry = useCallback(() => {
    clearError()
    const lastErrorMsg = messagesRef.current.filter((m) => m.isError).pop()
    const lastUser = messagesRef.current.filter((m) => m.role === "user").pop()
    if (lastErrorMsg && lastUser) {
      setMessages((prev) => prev.filter((m) => m.id !== lastErrorMsg.id))
      doSend(lastUser.content)
    }
  }, [clearError, doSend])

  return {
    messages,
    connectionState,
    errorMessage,
    sendMessage,
    retry,
    clearError,
    isSending,
  }
}
