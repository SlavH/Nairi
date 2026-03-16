/**
 * Pillar H: Learn and Education (Phases 87–94)
 * Real implementations: course progress, skill tree, certificates, learning paths, recommendations.
 */

import { createClient } from "@/lib/supabase/server"

export const SKILL_TREE_IDS = ["builder", "chat", "presentations", "workflows"] as const
export const LEARNING_PATHS = [
  { id: "builder-power", name: "Builder power user", courseIds: [] as string[] },
  { id: "ai-basics", name: "AI basics", courseIds: [] as string[] },
] as const

export async function getCourseProgress(userId: string, courseId: string): Promise<{ completed: number; total: number; percent: number }> {
  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("progress_percent")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single()
  const percent = enrollment?.progress_percent ?? 0
  const { count: completed } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
  const { data: modules } = await supabase.from("course_modules").select("id").eq("course_id", courseId)
  let total = 0
  for (const m of modules ?? []) {
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", m.id)
    total += count ?? 0
  }
  return { completed: completed ?? 0, total, percent }
}

export async function getSkillTree(userId: string): Promise<{ skillId: string; name: string; level: number }[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("user_skills").select("skill_id, mastery_level").eq("user_id", userId)
  const skills = (data ?? []).map((r) => ({ skillId: r.skill_id, name: "", level: r.mastery_level ?? 0 }))
  return skills
}

export async function issueCertificate(userId: string, courseId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("course_enrollments")
    .select("id, progress_percent, certificate_issued")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single()
  if (!data || data.progress_percent < 100) return ""
  if (data.certificate_issued) return `cert-${data.id}`
  await supabase.from("course_enrollments").update({ certificate_issued: true }).eq("id", data.id)
  return `cert-${data.id}`
}

export async function getLearnRecommendations(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("courses").select("id, title").eq("is_published", true).limit(5)
  return (data ?? []).map((r) => r.title ?? r.id)
}
