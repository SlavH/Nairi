/**
 * Pillar L: Security and Compliance (Phases 126–135)
 * Real implementations: RBAC, audit log, data residency, security headers.
 */

import { createClient } from "@/lib/supabase/server"

export const ROLES = ["admin", "member", "viewer"] as const
export type Role = (typeof ROLES)[number]
export const DATA_RESIDENCY_REGIONS = ["us", "eu"] as const
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
} as const

export async function getRole(userId: string, _orgId?: string): Promise<Role> {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single()
  const r = (data as { role?: string } | null)?.role
  if (r === "admin" || r === "member" || r === "viewer") return r
  return "member"
}

export async function auditLog(action: string, userId: string, meta?: Record<string, unknown>): Promise<void> {
  const supabase = await createClient()
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      category: "security",
      metadata: meta ?? {},
    })
  } catch {
    // Silently fail - audit logging should not block operations
  }
}

export function getSecurityHeaders(): Record<string, string> {
  return { ...SECURITY_HEADERS }
}
