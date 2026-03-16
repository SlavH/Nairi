import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getSessionOrBypass } from "@/lib/auth"
import { getQuizWithQuestions } from "@/lib/learn/quizzes"
import { QuizTaker } from "@/components/learn/quiz-taker"

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())
  if (!user) redirect("/auth/login")

  const { quiz, questions } = await getQuizWithQuestions(quizId)
  if (!quiz) notFound()

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/learn"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Learn
      </Link>
      <QuizTaker quiz={quiz} questions={questions} />
    </div>
  )
}
