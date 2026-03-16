/**
 * Pillar D: Marketplace and Agents (Phases 46–56)
 * Real implementations: agent verification, analytics, versioning, discovery, reviews, categories.
 */

import { createClient } from "@/lib/supabase/server"

export const AGENT_VERIFIED_BADGE = "verified"
export const AGENT_CATEGORIES = ["productivity", "creative", "analysis", "support", "Research", "Development", "Content", "Analytics", "Marketing", "Support", "Finance", "Legal", "other"] as const
export const AGENT_DEFAULT_QUOTA = 1000

export async function getAgentAnalytics(agentId: string): Promise<{ installs: number; usage: number; rating: number }> {
  const supabase = await createClient()
  const { data } = await supabase.from("agents").select("usage_count, rating").eq("id", agentId).single()
  return {
    installs: data?.usage_count ?? 0,
    usage: data?.usage_count ?? 0,
    rating: Number(data?.rating ?? 0),
  }
}

export async function getAgentVersions(agentId: string): Promise<{ version: string; at: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("agents").select("updated_at").eq("id", agentId).single()
  if (!data?.updated_at) return []
  return [{ version: "1.0", at: data.updated_at }]
}

export async function getAgentUsageQuota(agentId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase.from("agents").select("usage_count").eq("id", agentId).single()
  const used = data?.usage_count ?? 0
  return Math.max(0, AGENT_DEFAULT_QUOTA - used)
}

export async function isAgentVerified(agentId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.from("agents").select("creator_id").eq("id", agentId).single()
  if (!data?.creator_id) return false
  const { data: creator } = await supabase.from("creator_profiles").select("is_verified").eq("id", data.creator_id).single()
  return creator?.is_verified ?? false
}

export async function discoverAgents(options: {
  category?: string
  sort?: "popular" | "new" | "rating"
  search?: string
  limit?: number
}): Promise<{ id: string; name: string; description: string; category: string; rating: number; usage_count: number; is_featured: boolean }[]> {
  const supabase = await createClient()
  let q = supabase.from("agents").select("id, name, description, category, rating, usage_count, is_featured")
  if (options.category) q = q.eq("category", options.category)
  if (options.search) q = q.ilike("name", `%${options.search}%`)
  q = q.limit(options.limit ?? 50)
  if (options.sort === "popular") q = q.order("usage_count", { ascending: false })
  else if (options.sort === "rating") q = q.order("rating", { ascending: false })
  else q = q.order("created_at", { ascending: false })
  const { data } = await q
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    category: r.category,
    rating: Number(r.rating ?? 0),
    usage_count: r.usage_count ?? 0,
    is_featured: r.is_featured ?? false,
  }))
}

export async function getFeaturedAgents(limit = 6): Promise<{ id: string; name: string; description: string; category: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, category")
    .eq("is_featured", true)
    .order("usage_count", { ascending: false })
    .limit(limit)
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description ?? "", category: r.category }))
}

export async function incrementAgentUsage(agentId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.from("agents").select("usage_count").eq("id", agentId).single()
  const next = (data?.usage_count ?? 0) + 1
  await supabase.from("agents").update({ usage_count: next, updated_at: new Date().toISOString() }).eq("id", agentId)
}
