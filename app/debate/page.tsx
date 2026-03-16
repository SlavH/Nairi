import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DebateInterface } from "@/components/debate/debate-interface"
import { getSessionOrBypass } from "@/lib/auth"

export const metadata = {
  title: "Debate - Nairi",
  description: "Engage in multi-perspective debates with AI agents",
}

export default async function DebatePage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's debate sessions
  const { data: sessions } = await supabase
    .from("debate_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Debate Arena</h1>
          <p className="text-muted-foreground">
            Engage in structured debates with multiple AI perspectives. Challenge your ideas, explore different viewpoints, and strengthen your arguments.
          </p>
        </div>

        <DebateInterface sessions={sessions || []} userId={user.id} />
      </div>
    </div>
  )
}
