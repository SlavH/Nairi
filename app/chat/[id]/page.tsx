import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ChatPageClient } from "@/components/chat/chat-page-client"
import { getSessionOrBypass } from "@/lib/auth"

export default async function ChatConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ suggestion?: string }>
}) {
  const { id } = await params
  const { suggestion } = await searchParams
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const { data: conversation, error } = await supabase.from("conversations").select("*").eq("id", id).single()

  if (error || !conversation || conversation.user_id !== user.id) {
    notFound()
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  return (
    <ChatPageClient
      conversation={conversation}
      initialMessages={messages || []}
      userId={user.id}
    />
  )
}
