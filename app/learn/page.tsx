import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LearnDashboard } from "@/components/learn/learn-dashboard"
import { getSession } from "@/lib/auth"

export default async function LearnPage() {
  const supabase = await createClient()
  const user = await getSession(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's learning data
  const [coursesResult, skillsResult, pathsResult] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_skills")
      .select("*, skills(name, description, icon)")
      .eq("user_id", user.id),
    supabase
      .from("skill_trees")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
  ])

  // Fetch completed lesson progress (lesson_progress table; status is represented by completed=true)
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("*, lessons(*)")
    .eq("user_id", user.id)
    .eq("completed", true)

  const learningPaths = (pathsResult.data || []).map((tree: any) => ({
    id: tree.id,
    title: tree.name,
    description: tree.description,
    category: tree.category,
  }))

  return (
    <LearnDashboard
      courses={coursesResult.data || []}
      userSkills={skillsResult.data || []}
      learningPaths={learningPaths}
      completedLessons={progressData || []}
      userId={user.id}
    />
  )
}
