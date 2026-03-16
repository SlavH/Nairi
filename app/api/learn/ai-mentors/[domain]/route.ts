/**
 * GET /api/learn/ai-mentors/[domain] – get mentor for domain
 * PATCH /api/learn/ai-mentors/[domain] – record interaction or update notes/preferences
 * Body: { action: 'interaction' | 'progress_notes' | 'teaching_preferences', progress_notes?: string, teaching_preferences?: object }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getMentorByDomain,
  recordMentorInteraction,
  updateMentorProgressNotes,
  updateMentorTeachingPreferences,
} from "@/lib/learn/ai-mentors"
import { handleError } from "@/lib/errors/handler"

function decodeDomain(domain: string): string {
  return decodeURIComponent(domain)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { domain } = await params
    const mentor = await getMentorByDomain(user.id, decodeDomain(domain))
    if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 })
    return NextResponse.json({ mentor })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { domain } = await params
    const decoded = decodeDomain(domain)
    const body = await req.json()
    const { action, progress_notes, teaching_preferences } = body

    if (action === "interaction") {
      const mentor = await recordMentorInteraction(user.id, decoded)
      return NextResponse.json({ mentor })
    }

    const mentor = await getMentorByDomain(user.id, decoded)
    if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 })

    if (action === "progress_notes" && typeof progress_notes === "string") {
      const updated = await updateMentorProgressNotes(user.id, mentor.id, progress_notes)
      return NextResponse.json({ mentor: updated })
    }
    if (action === "teaching_preferences" && teaching_preferences && typeof teaching_preferences === "object") {
      const updated = await updateMentorTeachingPreferences(user.id, mentor.id, teaching_preferences)
      return NextResponse.json({ mentor: updated })
    }

    return NextResponse.json({ error: "Invalid action or payload" }, { status: 400 })
  } catch (error) {
    return handleError(error)
  }
}
