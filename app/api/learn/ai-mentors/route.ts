/**
 * GET /api/learn/ai-mentors – list user's AI mentors
 * POST /api/learn/ai-mentors – create or get mentor for domain
 * Body: { domain: string, mentorName?: string, personality?: string }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { listMentorsForUser, getOrCreateMentor } from "@/lib/learn/ai-mentors"
import { handleError } from "@/lib/errors/handler"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const mentors = await listMentorsForUser(user.id)
    return NextResponse.json({ mentors })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { domain, mentorName, personality } = body
    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "domain required" }, { status: 400 })
    }

    const mentor = await getOrCreateMentor(user.id, domain.trim(), {
      mentorName: mentorName?.trim(),
      personality: personality?.trim(),
    })
    return NextResponse.json({ mentor })
  } catch (error) {
    return handleError(error)
  }
}
