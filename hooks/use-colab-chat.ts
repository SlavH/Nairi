"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export type ColabChatMessage = { role: "user" | "assistant" | "system"; content: string }

const FALLBACK_MESSAGE =
  "The AI backend is unavailable. Check that your Colab server is running and the URL in .env is correct. If you just restarted Colab, update COLAB_AI_BASE_URL with the new ngrok URL."

export interface UseColabChatOptions {
  maxTokens?: number
  initialMessages?: ColabChatMessage[]
}

export interface UseColabChatReturn {
  messages: ColabChatMessage[]
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
  isAvailable: boolean | null
  checkHealth: () => Promise<void>
}

/**
 * Chat hook for Colab backend (POST /api/chat/colab).
 * Prevents parallel requests, shows loading state, handles errors and fallback message.
 */
export function useColabChat(options: UseColabChatOptions = {}): UseColabChatReturn {
  const { maxTokens = 300, initialMessages = [] } = options
  const [messages, setMessages] = useState<ColabChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const messagesRef = useRef<ColabChatMessage[]>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health/colab")
      const data = await res.json()
      setIsAvailable(data?.ok === true)
    } catch {
      setIsAvailable(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content?.trim()
      if (!trimmed || isLoading) return

      const userMessage: ColabChatMessage = { role: "user", content: trimmed }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      const payload: ColabChatMessage[] = [
        ...messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: trimmed },
      ]

      try {
        const res = await fetch("/api/chat/colab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload, max_tokens: maxTokens }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data?.details ?? data?.error ?? "Request failed")
          setMessages((prev) => [...prev, { role: "assistant", content: FALLBACK_MESSAGE }])
          return
        }

        const reply = typeof data.response === "string" ? data.response : FALLBACK_MESSAGE
        setMessages((prev) => [...prev, { role: "assistant", content: reply }])
        if (data.fromFallback) setError("Backend returned fallback response")
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        setMessages((prev) => [...prev, { role: "assistant", content: `${FALLBACK_MESSAGE} (${message})` }])
      } finally {
        setIsLoading(false)
      }
    },
    [maxTokens, isLoading]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearError,
    isAvailable,
    checkHealth,
  }
}
