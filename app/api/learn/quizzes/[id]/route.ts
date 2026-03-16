/**
 * GET /api/learn/quizzes/[id] – quiz with questions (for taking).
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getQuizWithQuestions } from "@/lib/learn/quizzes"
import { handleError } from "@/lib/errors/handler"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { quiz, questions } = await getQuizWithQuestions(id)
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 })

    return NextResponse.json({ quiz, questions })
  } catch (error) {
    return handleError(error)
  }
}
