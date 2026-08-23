import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { Bot, User } from "lucide-react"

import { getSharedConversation } from "@/lib/features/chat"

// Shared conversations are ephemeral links: keep them out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type MessageContent = string | Array<{ type?: string; text?: string }> | Record<string, unknown> | null

function contentToText(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    // UIMessage parts style: [{ type: "text", text: "..." }, ...]
    return content
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .filter(Boolean)
      .join("\n\n")
  }
  if (content && typeof content === "object") return JSON.stringify(content)
  return ""
}

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!slug) notFound()

  const conversation = await getSharedConversation(slug)
  if (!conversation) notFound()

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{conversation.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Read-only shared conversation</p>
      </header>

      <div className="space-y-6">
        {conversation.messages.length === 0 && (
          <p className="text-center text-muted-foreground">This conversation has no messages.</p>
        )}
        {conversation.messages.map((m, i) => (
          <div key={i} className="flex gap-3">
            <div className="shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {m.role === "user" ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <Bot className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 rounded-lg border bg-card/50 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {m.role}
              </p>
              <div className="whitespace-pre-wrap break-words text-sm">
                {contentToText(m.content)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-12 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Try Nairi yourself →
        </Link>
      </footer>
    </div>
  )
}
