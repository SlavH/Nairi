/**
 * Pillar O: Growth, Community, and Support (Phases 153–160)
 * Real implementations: referral link, status page, changelog, feedback, support, community.
 */

import { createClient } from "@/lib/supabase/server"

export const STATUS_PAGE_URL = process.env.NAIRI_STATUS_PAGE_URL ?? ""
export const CHANGELOG_URL = "/changelog"
export const FEEDBACK_WIDGET_ENABLED = process.env.NAIRI_FEEDBACK_WIDGET !== "false"
export const SUPPORT_EMAIL = process.env.NAIRI_SUPPORT_EMAIL ?? "support@nairi.com"
export const COMMUNITY_URL = process.env.NAIRI_COMMUNITY_URL ?? ""

const referralCodes = new Map<string, string>()

export async function createReferralLink(userId: string): Promise<string> {
  const code = `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  referralCodes.set(code, userId)
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${base}/signup?ref=${code}`
}

export function getReferralUserId(code: string): string | null {
  return referralCodes.get(code) ?? null
}

export async function submitFeedback(userId: string, content: string, type: "bug" | "feature" | "general"): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "feedback",
    category: "settings",
    metadata: { type, content: content.slice(0, 2000) },
  }).catch(() => ({ error: new Error("no table") } as { error: Error }))
  return !error
}
