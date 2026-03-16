/**
 * POST /api/learn/quizzes/[id]/attempt – submit quiz attempt.
 * Body: { answers: Record<string, string>, time_taken_seconds?: number, ai_feedback?: string }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitQuizAttempt, getQuizAttempts } from "@/lib/learn/quizzes"
import { handleError } from "@/lib/errors/handler"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: quizId } = await params
    const body = await req.json()
    const { answers = {}, time_taken_seconds, ai_feedback } = body

    const attempt = await submitQuizAttempt(user.id, quizId, {
      answers,
      time_taken_seconds,
      ai_feedback,
    })
    return NextResponse.json({ attempt })
  } catch (error) {
    return handleError(error)
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: quizId } = await params
    const url = new URL(req.url)
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20", 10) || 20)

    const attempts = await getQuizAttempts(user.id, quizId, limit)
    return NextResponse.json({ attempts })
  } catch (error) {
    return handleError(error)
  }
}
