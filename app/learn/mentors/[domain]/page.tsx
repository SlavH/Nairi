import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"

import { MentorDetail } from "@/components/learn/mentor-detail"
import { getSession } from "@/lib/auth"
import { getMentorByDomain } from "@/lib/learn/ai-mentors"
import { createClient } from "@/lib/supabase/server"

export default async function MentorDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const { domain } = await params
  const decoded = decodeURIComponent(domain)
  const supabase = await createClient()
  const user = await getSession(() => supabase.auth.getUser())
  if (!user) redirect("/auth/login")

  const mentor = await getMentorByDomain(user.id, decoded)
  if (!mentor) notFound()

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Link
        href="/learn/mentors"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Mentors
      </Link>
      <MentorDetail mentor={mentor} userId={user.id} />
    </div>
  )
}
