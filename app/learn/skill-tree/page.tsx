import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SkillTreeView } from "@/components/learn/skill-tree-view"
import { getSession } from "@/lib/auth"

export default async function SkillTreePage() {
  const supabase = await createClient()
  const { user } = await getSession(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const [treesResult, userSkillsResult] = await Promise.all([
    supabase
      .from("skill_trees")
      .select("*, skill_nodes(*)")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase.from("user_skills").select("*").eq("user_id", user.id),
  ])

  return <SkillTreeView skillTrees={treesResult.data || []} userSkills={userSkillsResult.data || []} userId={user.id} />
}
