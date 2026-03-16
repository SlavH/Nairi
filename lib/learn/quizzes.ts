/**
 * Quiz system: quizzes, quiz_questions, quiz_attempts
 * Full CRUD and attempt scoring.
 */

import { createClient } from "@/lib/supabase/server"

export type QuizType = "multiple_choice" | "oral_exam" | "coding" | "essay"
export interface Quiz {
  id: string
  lesson_id: string | null
  course_id: string | null
  title: string
  quiz_type: QuizType
  passing_score: number
  time_limit_minutes: number | null
  is_adaptive: boolean
  created_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  question_type: string
  options: string[] | Record<string, unknown> | null
  correct_answer: string | null
  explanation: string | null
  difficulty: number
  order_index: number
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number | null
  passed: boolean | null
  answers: Record<string, unknown> | null
  time_taken_seconds: number | null
  ai_feedback: string | null
  attempted_at: string
}

export async function getQuizzesForLesson(lessonId: string): Promise<Quiz[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as Quiz[]
}

export async function getQuizzesForCourse(courseId: string): Promise<Quiz[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as Quiz[]
}

export async function getQuizWithQuestions(quizId: string): Promise<{
  quiz: Quiz | null
  questions: QuizQuestion[]
}> {
  const supabase = await createClient()
  const [quizRes, questionsRes] = await Promise.all([
    supabase.from("quizzes").select("*").eq("id", quizId).single(),
    supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true }),
  ])
  if (quizRes.error) throw quizRes.error
  if (questionsRes.error) throw questionsRes.error
  return {
    quiz: quizRes.data as Quiz | null,
    questions: (questionsRes.data ?? []) as QuizQuestion[],
  }
}

function computeScore(
  questions: QuizQuestion[],
  answers: Record<string, string>,
  passingScore: number
): { score: number; passed: boolean; correct: number; total: number } {
  let correct = 0
  const total = questions.length
  for (const q of questions) {
    const userAnswer = answers[q.id]
    if (userAnswer != null && q.correct_answer != null && String(userAnswer).trim() === String(q.correct_answer).trim()) {
      correct++
    }
  }
  const score = total > 0 ? Math.round((correct / total) * 100) : 0
  return { score, passed: score >= passingScore, correct, total }
}

export async function submitQuizAttempt(
  userId: string,
  quizId: string,
  params: {
    answers: Record<string, string>
    time_taken_seconds?: number
    ai_feedback?: string
  }
): Promise<QuizAttempt> {
  const supabase = await createClient()
  const { quiz, questions } = await getQuizWithQuestions(quizId)
  if (!quiz) throw new Error("Quiz not found")

  const { score, passed, correct, total } = computeScore(
    questions,
    params.answers,
    quiz.passing_score
  )

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: userId,
      quiz_id: quizId,
      score,
      passed,
      answers: params.answers as unknown as Record<string, unknown>,
      time_taken_seconds: params.time_taken_seconds ?? null,
      ai_feedback: params.ai_feedback ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as QuizAttempt
}

export async function getQuizAttempts(
  userId: string,
  quizId: string,
  limit = 20
): Promise<QuizAttempt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("attempted_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as QuizAttempt[]
}

export async function getBestQuizScore(
  userId: string,
  quizId: string
): Promise<{ bestScore: number; passed: boolean; attemptCount: number } | null> {
  const attempts = await getQuizAttempts(userId, quizId, 100)
  if (attempts.length === 0) return null
  const best = attempts.reduce((a, b) => ((a?.score ?? 0) >= (b?.score ?? 0) ? a : b), attempts[0])
  const passedAttempt = attempts.find((a) => a.passed)
  return {
    bestScore: best?.score ?? 0,
    passed: !!passedAttempt,
    attemptCount: attempts.length,
  }
}
