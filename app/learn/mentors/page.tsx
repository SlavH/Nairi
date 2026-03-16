import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Plus } from "lucide-react"
import { getSessionOrBypass } from "@/lib/auth"
import { listMentorsForUser } from "@/lib/learn/ai-mentors"
import { AIMentorsList } from "@/components/learn/ai-mentors-list"

export default async function MentorsPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())
  if (!user) redirect("/auth/login")

  const mentors = await listMentorsForUser(user.id)

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Link
        href="/learn"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Learn
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Mentors</h1>
        <Link
          href="/learn/mentors/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New mentor
        </Link>
      </div>
      <p className="text-muted-foreground mb-6">
        Long-term AI mentors for different subjects. Each mentor remembers your progress and adapts to your goals.
      </p>
      <AIMentorsList mentors={mentors} />
    </div>
  )
}
