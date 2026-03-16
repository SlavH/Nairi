import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LearnDashboard } from "@/components/learn/learn-dashboard"
import { getSessionOrBypass } from "@/lib/auth"

export default async function LearnPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's learning data
  // Simplified query - fetch courses without lessons join to avoid FK issues
  const [coursesResult, skillsResult, pathsResult] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    Promise.resolve({ data: [], error: null }),
    Promise.resolve({ data: [], error: null }),
  ])

  // Fetch completed lesson progress (lesson_progress table; status is represented by completed=true)
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("*, lessons(*)")
    .eq("user_id", user.id)
    .eq("completed", true)

  return (
    <LearnDashboard
      courses={coursesResult.data || []}
      userSkills={skillsResult.data || []}
      learningPaths={pathsResult.data || []}
      completedLessons={progressData || []}
      userId={user.id}
    />
  )
}
