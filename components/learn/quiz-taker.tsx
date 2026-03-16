"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react"

type QuizQuestion = {
  id: string
  question: string
  question_type: string
  options: string[] | Record<string, unknown> | null
  correct_answer: string | null
  explanation: string | null
  order_index: number
}

type Quiz = {
  id: string
  title: string
  quiz_type: string
  passing_score: number
  time_limit_minutes: number | null
}

interface QuizTakerProps {
  quiz: Quiz
  questions: QuizQuestion[]
  onComplete?: (result: { score: number; passed: boolean; timeTakenSeconds: number }) => void
}

function parseOptions(opts: string[] | Record<string, unknown> | null): string[] {
  if (!opts) return []
  if (Array.isArray(opts)) return opts
  if (typeof opts === "object" && opts !== null && "options" in opts) {
    const o = (opts as { options: unknown }).options
    return Array.isArray(o) ? o as string[] : []
  }
  return Object.entries(opts).map(([k, v]) => `${k}: ${String(v)}`)
}

export function QuizTaker({ quiz, questions, onComplete }: QuizTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState(() => Date.now())
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    correct: number
    total: number
    timeTakenSeconds: number
    ai_feedback?: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex]
  const options = parseOptions(currentQuestion?.options ?? null)
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const timeTakenSeconds = Math.round((Date.now() - startTime) / 1000)
    try {
      const res = await fetch(`/api/learn/quizzes/${quiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          time_taken_seconds: timeTakenSeconds,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Submit failed")
      const attempt = data.attempt
      setResult({
        score: attempt.score ?? 0,
        passed: !!attempt.passed,
        correct: 0,
        total: questions.length,
        timeTakenSeconds,
        ai_feedback: attempt.ai_feedback ?? undefined,
      })
      setSubmitted(true)
      onComplete?.({
        score: attempt.score ?? 0,
        passed: !!attempt.passed,
        timeTakenSeconds,
      })
    } catch (e) {
      console.error(e)
      setResult({
        score: 0,
        passed: false,
        correct: 0,
        total: questions.length,
        timeTakenSeconds,
      })
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }, [quiz.id, answers, startTime, questions.length, onComplete])

  if (submitted && result) {
    return (
      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-amber-500" />
            )}
            {result.passed ? "Quiz passed" : "Quiz incomplete"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{result.score}%</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{result.timeTakenSeconds}s</p>
              <p className="text-sm text-muted-foreground">Time</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Passing score: {quiz.passing_score}%
          </p>
          {result.ai_feedback && (
            <p className="text-sm border rounded-lg p-3 bg-white/5">{result.ai_feedback}</p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) {
    return (
      <Card className="bg-white/5 border-white/20">
        <CardContent className="py-8 text-center text-muted-foreground">
          No questions in this quiz.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{quiz.title}</CardTitle>
          {quiz.time_limit_minutes != null && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {quiz.time_limit_minutes} min limit
            </span>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">{currentQuestion.question}</Label>
          <RadioGroup
            value={answers[currentQuestion.id] ?? ""}
            onValueChange={(v) => setAnswer(currentQuestion.id, v)}
            className="mt-3 space-y-2"
          >
            {options.map((opt, i) => (
              <div
                key={i}
                className="flex items-center space-x-2 rounded-lg border border-white/20 p-3 hover:bg-white/5"
              >
                <RadioGroupItem value={opt} id={`q-${currentQuestion.id}-${i}`} />
                <Label htmlFor={`q-${currentQuestion.id}-${i}`} className="flex-1 cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex((i) => i + 1)}
              disabled={!answers[currentQuestion.id]}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit quiz"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
