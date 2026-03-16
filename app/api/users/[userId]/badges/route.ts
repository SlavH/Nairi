/**
 * GET /api/users/[userId]/badges – list user's earned badges (with expert_badges)
 * POST /api/users/[userId]/badges – award badge (body: { badge_id, earned_via?, verification_data? })
 *   Caller must be admin or the user themselves for self-award (e.g. after exam).
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserBadges, awardBadgeToUser } from "@/lib/features/badges"
import { handleError } from "@/lib/errors/handler"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const badges = await getUserBadges(userId)
    return NextResponse.json({ badges })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId } = await params
    const body = await req.json()
    const { badge_id, earned_via, verification_data } = body

    if (!badge_id) return NextResponse.json({ error: "badge_id required" }, { status: 400 })

    // Allow self-award or admin (e.g. profile.role === 'admin')
    if (user.id !== userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      if ((profile as { role?: string } | null)?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const badge = await awardBadgeToUser(userId, badge_id, {
      earnedVia: earned_via,
      verificationData: verification_data,
    })
    return NextResponse.json({ badge })
  } catch (error) {
    return handleError(error)
  }
}
