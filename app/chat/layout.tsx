import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { getSessionOrBypass } from "@/lib/auth"
import { getConversationFolders } from "@/lib/features/chat"

export const dynamic = "force-dynamic"

const LAYOUT_TIMEOUT_MS = 30_000

async function loadChatLayoutData(): Promise<{
  conversations: { id: string; title: string; updated_at: string; is_pinned?: boolean; pinned_at?: string | null; folder_id?: string | null }[]
  projects: { id: string; name: string }[]
  userId: string
}> {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const withFolder = await supabase
    .from("conversations")
    .select("id, title, updated_at, is_pinned, pinned_at, folder_id")
    .eq("user_id", user.id)
    .order("is_pinned", { ascending: false, nullsFirst: false })
    .order("pinned_at", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false })

  let conversations: { id: string; title: string; updated_at: string; is_pinned?: boolean; pinned_at?: string | null; folder_id?: string | null }[]
  if (withFolder.error && (String(withFolder.error.message).includes("folder_id") || String(withFolder.error.message).includes("column"))) {
    const withoutFolder = await supabase
      .from("conversations")
      .select("id, title, updated_at, is_pinned, pinned_at")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false, nullsFirst: false })
      .order("pinned_at", { ascending: false, nullsFirst: true })
      .order("updated_at", { ascending: false })
    conversations = withoutFolder.data ?? []
  } else {
    conversations = withFolder.data ?? []
  }

  let projects: { id: string; name: string }[] = []
  try {
    projects = await getConversationFolders(user.id)
  } catch {
    projects = []
  }

  return { conversations, projects, userId: user.id }
}

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let conversations: { id: string; title: string; updated_at: string; is_pinned?: boolean; pinned_at?: string | null; folder_id?: string | null }[] = []
  let projects: { id: string; name: string }[] = []
  let userId: string

  try {
    const result = await Promise.race([
      loadChatLayoutData(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Chat layout timeout")), LAYOUT_TIMEOUT_MS)
      ),
    ])
    conversations = result.conversations
    projects = result.projects
    userId = result.userId
  } catch {
    redirect("/auth/login")
  }

  return (
    <div className="chat-viewport-ios min-h-0 w-full overflow-hidden flex flex-col sm:flex-row bg-gradient-to-br from-purple-950 via-pink-950 to-cyan-950 p-2 sm:p-3 gap-2 sm:gap-3">
      <ChatSidebar conversations={conversations} projects={projects} userId={userId} />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
        {children}
      </main>
    </div>
  )
}
