"use client"

import { useState, useEffect } from "react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { NairiChatView } from "@/components/chat/nairi-chat-view"

interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: string
  content: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface Conversation {
  id: string
  title: string
  user_id: string
}

export function ChatPageClient({
  conversation,
  initialMessages,
  userId,
}: {
  conversation: Conversation
  initialMessages: Message[]
  userId: string
}) {
  const [nairiEnabled, setNairiEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/nairi/config")
      .then((r) => r.json())
      .then((d) => setNairiEnabled(d?.enabled === true))
      .catch(() => setNairiEnabled(false))
  }, [])

  if (nairiEnabled === null) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (nairiEnabled) {
    return <NairiChatView />
  }

  return (
    <ChatInterface
      key={conversation.id}
      conversation={conversation}
      initialMessages={initialMessages}
      userId={userId}
    />
  )
}
