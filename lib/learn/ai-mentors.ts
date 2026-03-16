/**
 * AI Mentors: long-term domain mentors (ai_mentors table)
 * Full CRUD, interaction tracking, progress notes.
 */

import { createClient } from "@/lib/supabase/server"

export interface AIMentor {
  id: string
  user_id: string
  domain: string
  mentor_name: string
  mentor_personality: string | null
  interaction_count: number
  last_interaction: string | null
  progress_notes: string | null
  teaching_preferences: Record<string, unknown>
  created_at: string
}

export async function listMentorsForUser(userId: string): Promise<AIMentor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_mentors")
    .select("*")
    .eq("user_id", userId)
    .order("last_interaction", { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as AIMentor[]
}

export async function getMentorByDomain(
  userId: string,
  domain: string
): Promise<AIMentor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_mentors")
    .select("*")
    .eq("user_id", userId)
    .eq("domain", domain)
    .single()
  if (error && error.code !== "PGRST116") throw error
  return data as AIMentor | null
}

export async function getOrCreateMentor(
  userId: string,
  domain: string,
  options?: { mentorName?: string; personality?: string }
): Promise<AIMentor> {
  const existing = await getMentorByDomain(userId, domain)
  if (existing) return existing

  const supabase = await createClient()
  const name = options?.mentorName ?? domain.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const { data, error } = await supabase
    .from("ai_mentors")
    .insert({
      user_id: userId,
      domain,
      mentor_name: name,
      mentor_personality: options?.personality ?? null,
      interaction_count: 0,
      teaching_preferences: {},
    })
    .select()
    .single()
  if (error) throw error
  return data as AIMentor
}

export async function recordMentorInteraction(
  userId: string,
  domain: string
): Promise<AIMentor | null> {
  const supabase = await createClient()
  const mentor = await getMentorByDomain(userId, domain)
  if (!mentor) return null

  const { data, error } = await supabase
    .from("ai_mentors")
    .update({
      interaction_count: (mentor.interaction_count ?? 0) + 1,
      last_interaction: new Date().toISOString(),
    })
    .eq("id", mentor.id)
    .select()
    .single()
  if (error) throw error
  return data as AIMentor
}

export async function updateMentorProgressNotes(
  userId: string,
  mentorId: string,
  progressNotes: string
): Promise<AIMentor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_mentors")
    .update({ progress_notes: progressNotes })
    .eq("id", mentorId)
    .eq("user_id", userId)
    .select()
    .single()
  if (error) throw error
  return data as AIMentor
}

export async function updateMentorTeachingPreferences(
  userId: string,
  mentorId: string,
  preferences: Record<string, unknown>
): Promise<AIMentor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_mentors")
    .update({ teaching_preferences: preferences })
    .eq("id", mentorId)
    .eq("user_id", userId)
    .select()
    .single()
  if (error) throw error
  return data as AIMentor
}
