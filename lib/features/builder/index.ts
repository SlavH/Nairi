/**
 * Pillar C: Builder (Phases 33–45)
 * Real implementations: project versioning, deploy history, component library, usage limits.
 */

import { createClient } from "@/lib/supabase/server"

export const BUILDER_MAX_VERSIONS_PER_PROJECT = 50
export const BUILDER_DEPLOY_PROVIDERS = ["vercel", "netlify"] as const
export const BUILDER_COMPONENT_LIBRARY = ["header", "footer", "hero", "cta", "features", "testimonials"] as const
export const BUILDER_GENERATE_LIMIT_PER_DAY = 100
export const BUILDER_DEPLOY_LIMIT_PER_DAY = 20

export async function saveBuilderSnapshot(projectId: string, content: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: project } = await supabase
    .from("builder_projects")
    .select("versions, files")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single()
  if (!project) return false
  const versions = (project.versions as unknown[]) ?? []
  const snapshot = { at: new Date().toISOString(), files: project.files ?? [], contentPreview: content.slice(0, 200) }
  const next = [...versions.slice(-(BUILDER_MAX_VERSIONS_PER_PROJECT - 1)), snapshot]
  const { error } = await supabase
    .from("builder_projects")
    .update({ versions: next })
    .eq("id", projectId)
    .eq("user_id", userId)
  return !error
}

export async function getBuilderVersions(projectId: string, userId: string): Promise<{ at: string; preview: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("builder_projects")
    .select("versions")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single()
  const versions = (data?.versions as Array<{ at?: string; contentPreview?: string }>) ?? []
  return versions.map((v) => ({ at: v.at ?? "", preview: v.contentPreview ?? "" }))
}

export async function getBuilderDeployHistory(projectId: string, userId: string): Promise<{ id: string; url: string; at: string; provider: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("builder_deploys")
    .select("id, url, created_at, provider")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)
  return (data ?? []).map((r) => ({
    id: r.id,
    url: r.url ?? "",
    at: r.created_at ?? "",
    provider: r.provider ?? "vercel",
  }))
}

export async function recordBuilderDeploy(
  projectId: string,
  userId: string,
  provider: "vercel" | "netlify",
  url: string,
  status: "pending" | "success" | "failed"
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("builder_deploys")
    .insert({ project_id: projectId, user_id: userId, provider, url, status })
    .select("id")
    .single()
  return error ? null : data?.id ?? null
}

export async function getBuilderUsageCount(userId: string, action: "generate" | "deploy" = "generate"): Promise<number> {
  const supabase = await createClient()
  const start = new Date()
  start.setDate(start.getDate() - 1)
  const { count, error } = await supabase
    .from("builder_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", start.toISOString())
  if (error) return 0
  return count ?? 0
}

export async function recordBuilderUsage(userId: string, action: "generate" | "deploy", projectId?: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from("builder_usage").insert({ user_id: userId, action, project_id: projectId ?? null })
}

export function canGenerate(userId: string): Promise<boolean> {
  return getBuilderUsageCount(userId, "generate").then((c) => c < BUILDER_GENERATE_LIMIT_PER_DAY)
}

export function canDeploy(userId: string): Promise<boolean> {
  return getBuilderUsageCount(userId, "deploy").then((c) => c < BUILDER_DEPLOY_LIMIT_PER_DAY)
}
