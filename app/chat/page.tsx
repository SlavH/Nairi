import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Sparkles } from "lucide-react"
import { getSessionOrBypass } from "@/lib/auth"
import { ChatWelcomeCards } from "@/components/chat/chat-welcome-cards"

export default async function ChatPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Create a new conversation and redirect
  const { data: newConversation, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      title: "New Conversation",
    })
    .select()
    .single()

  if (newConversation && !error) {
    redirect(`/chat/${newConversation.id}`)
  }

  // If database operation fails (e.g., in testing mode), show the welcome screen

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 page-container min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full text-center space-y-8 sm:space-y-10">
        <Image
          src="/images/nairi-logo-header.jpg"
          alt="Nairi"
          width={100}
          height={100}
          className="mx-auto rounded-2xl border border-border/50"
        />
        <div>
          <div className="section-badge mb-4 inline-flex">
            <Sparkles className="h-4 w-4 text-[#e879f9]" />
            <span>AI-Powered</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="gradient-text">Welcome to Nairi Chat</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">Your intelligent AI companion ready to help with any task.</p>
        </div>

        <ChatWelcomeCards />
      </div>
    </div>
  )
}
