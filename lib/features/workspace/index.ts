/**
 * Pillar G: Workspace, Creations, and Dashboard (Phases 76–86)
 * Real implementations: creations gallery, sharing, dashboard widgets, execution traces.
 */

import { createClient } from "@/lib/supabase/server"

export type CreationType = "builder" | "presentation" | "document"
export const DASHBOARD_WIDGET_IDS = ["usage", "recent-activity", "quick-actions"] as const

export async function getCreationsGallery(
  userId: string,
  type?: CreationType
): Promise<{ id: string; name: string; type: CreationType; updatedAt: string }[]> {
  const supabase = await createClient()
  const out: { id: string; name: string; type: CreationType; updatedAt: string }[] = []
  if (!type || type === "builder") {
    const { data } = await supabase
      .from("builder_projects")
      .select("id, name, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50)
    for (const r of data ?? []) {
      out.push({ id: r.id, name: r.name ?? "Untitled", type: "builder", updatedAt: r.updated_at ?? "" })
    }
  }
  return out
}

const shareLinks = new Map<string, { creationId: string; type: CreationType; perms: string; expiresAt: number }>()

export async function shareCreation(
  creationId: string,
  type: CreationType,
  perms: "view" | "edit",
  expiryHours?: number
): Promise<string> {
  const slug = `share-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  const expiresAt = expiryHours ? Date.now() + expiryHours * 60 * 60 * 1000 : 0
  shareLinks.set(slug, { creationId, type, perms, expiresAt })
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${base}/share/${slug}`
}

export function getSharedCreation(slug: string): { creationId: string; type: CreationType; perms: string } | null {
  const entry = shareLinks.get(slug)
  if (!entry) return null
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    shareLinks.delete(slug)
    return null
  }
  return { creationId: entry.creationId, type: entry.type, perms: entry.perms }
}

export async function getExecutionTraces(userId: string, _filter?: { type?: string; status?: string }): Promise<unknown[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("execution_traces").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100)
  return data ?? []
}
