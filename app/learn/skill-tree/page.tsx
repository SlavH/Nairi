import { redirect } from "next/navigation"

import { SkillTreeView } from "@/components/learn/skill-tree-view"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function SkillTreePage() {
  const supabase = await createClient()
  const user = await getSession(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const [treesResult, userSkillsResult] = await Promise.all([
    supabase
      .from("skill_trees")
      .select("*, skills(*)")
      .eq("is_public", true)
      .order("name", { ascending: true }),
    supabase.from("user_skills").select("*").eq("user_id", user.id),
  ])

  return <SkillTreeView skillTrees={treesResult.data || []} userSkills={userSkillsResult.data || []} userId={user.id} />
}
