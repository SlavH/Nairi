/**
 * Expert badges and user badges (marketplace/creator)
 * Full CRUD for user badges; read-only expert badge catalog.
 */

import { createClient } from "@/lib/supabase/server"

export interface ExpertBadge {
  id: string
  name: string
  domain: string
  description: string | null
  requirements: string | null
  icon: string | null
  color: string | null
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_via: string | null
  verification_data: Record<string, unknown> | null
  earned_at: string
  expert_badges?: ExpertBadge | null
}

export async function listExpertBadges(): Promise<ExpertBadge[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expert_badges")
    .select("*")
    .order("domain")
  if (error) throw error
  return (data ?? []) as ExpertBadge[]
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_badges")
    .select("*, expert_badges(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as UserBadge[]
}

export async function getCreatorBadges(creatorUserId: string): Promise<UserBadge[]> {
  return getUserBadges(creatorUserId)
}

export async function awardBadgeToUser(
  userId: string,
  badgeId: string,
  options?: { earnedVia?: string; verificationData?: Record<string, unknown> }
): Promise<UserBadge> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_badges")
    .upsert(
      {
        user_id: userId,
        badge_id: badgeId,
        earned_via: options?.earnedVia ?? "verification",
        verification_data: options?.verificationData ?? null,
      },
      { onConflict: "user_id,badge_id" }
    )
    .select()
    .single()
  if (error) throw error
  return data as UserBadge
}

export async function revokeUserBadge(userId: string, badgeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
  if (error) throw error
}

export async function getExpertBadgeById(badgeId: string): Promise<ExpertBadge | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expert_badges")
    .select("*")
    .eq("id", badgeId)
    .single()
  if (error && error.code !== "PGRST116") throw error
  return data as ExpertBadge | null
}
