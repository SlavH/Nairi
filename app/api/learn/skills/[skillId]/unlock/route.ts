import { NextResponse } from "next/server"

import { getUserIdForApi } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/learn/skills/[skillId]/unlock — unlock a skill for the caller.
 * Prerequisite skills must already be unlocked, otherwise 409.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const supabase = await createClient()
  const userId = await getUserIdForApi(() => supabase.auth.getUser())
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { skillId } = await params

  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("id, name, prerequisites")
    .eq("id", skillId)
    .single()
  if (skillError || !skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 })
  }

  const prerequisites: string[] = Array.isArray(skill.prerequisites)
    ? skill.prerequisites
    : []

  if (prerequisites.length > 0) {
    const { data: prereqRows } = await supabase
      .from("user_skills")
      .select("skill_id, unlocked")
      .eq("user_id", userId)
      .in("skill_id", prerequisites)

    const unlockedSet = new Set((prereqRows ?? []).filter((r) => r.unlocked).map((r) => r.skill_id))
    const missing = prerequisites.filter((p) => !unlockedSet.has(p))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Prerequisites not completed", missing },
        { status: 409 }
      )
    }
  }

  const { data, error } = await supabase
    .from("user_skills")
    .upsert(
      {
        user_id: userId,
        skill_id: skillId,
        unlocked: true,
        last_practiced: new Date().toISOString(),
      },
      { onConflict: "user_id,skill_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("Skill unlock error:", error)
    return NextResponse.json({ error: "Failed to unlock skill" }, { status: 500 })
  }

  return NextResponse.json({ success: true, userSkill: data })
}
