/**
 * GET /api/learn/quizzes?lessonId=... | ?courseId=...
 * Returns quizzes for a lesson or course.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getQuizzesForLesson, getQuizzesForCourse } from "@/lib/learn/quizzes"
import { handleError } from "@/lib/errors/handler"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const lessonId = url.searchParams.get("lessonId")
    const courseId = url.searchParams.get("courseId")

    if (lessonId) {
      const quizzes = await getQuizzesForLesson(lessonId)
      return NextResponse.json({ quizzes })
    }
    if (courseId) {
      const quizzes = await getQuizzesForCourse(courseId)
      return NextResponse.json({ quizzes })
    }
    return NextResponse.json({ error: "lessonId or courseId required" }, { status: 400 })
  } catch (error) {
    return handleError(error)
  }
}
