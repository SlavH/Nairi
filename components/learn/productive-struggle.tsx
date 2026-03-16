"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Lightbulb, CheckCircle2, HelpCircle, Eye, EyeOff, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

interface ProductiveStruggleProps {
  question: string
  hints: string[]
  answer: string
  onComplete: (userAnswer: string, wasCorrect: boolean, hintsUsed: number) => void
  previousAttempts?: number
  isRevisit?: boolean
}

export function ProductiveStruggle({
  question,
  hints,
  answer,
  onComplete,
  previousAttempts = 0,
  isRevisit = false,
}: ProductiveStruggleProps) {
  const t = useTranslation()
  const [userAnswer, setUserAnswer] = useState("")
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<"correct" | "partial" | "incorrect" | null>(null)

  const handleRevealHint = () => {
    if (hintsRevealed < hints.length) {
      setHintsRevealed((prev) => prev + 1)
    }
  }

  const handleSubmit = () => {
    setHasSubmitted(true)
    // Simple comparison - in real app, use AI to evaluate
    const isCorrect = userAnswer.toLowerCase().includes(answer.toLowerCase().substring(0, 20))
    setFeedback(isCorrect ? "correct" : userAnswer.length > 50 ? "partial" : "incorrect")
  }

  const handleComplete = () => {
    onComplete(userAnswer, feedback === "correct", hintsRevealed)
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
    setHasSubmitted(true)
    setFeedback("incorrect")
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#e052a0]/10 to-[#00c9c8]/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t.learn.productiveStruggle}
          </CardTitle>
          {isRevisit && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Revisit
            </Badge>
          )}
        </div>
        {isRevisit && (
          <CardDescription className="flex items-center gap-1 text-yellow-600">
            <Lightbulb className="h-4 w-4" />
            {t.learn.errorMemory} {t.learn.revisitTopic}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Question */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t.learn.tryYourself}</p>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="font-medium">{question}</p>
          </div>
        </div>

        {/* User Answer */}
        <div className="space-y-2">
          <Textarea
            placeholder="Your answer..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={hasSubmitted}
            className={cn(
              "min-h-[120px]",
              feedback === "correct" && "border-green-500",
              feedback === "incorrect" && "border-red-500",
              feedback === "partial" && "border-yellow-500",
            )}
          />

          {/* Feedback */}
          {feedback && (
            <div
              className={cn(
                "p-3 rounded-lg flex items-start gap-2",
                feedback === "correct" && "bg-green-500/10 text-green-500",
                feedback === "partial" && "bg-yellow-500/10 text-yellow-500",
                feedback === "incorrect" && "bg-red-500/10 text-red-500",
              )}
            >
              {feedback === "correct" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <Lightbulb className="h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="font-medium">
                  {feedback === "correct" && "Great job! You got it right."}
                  {feedback === "partial" && "You're on the right track. Consider the hints below."}
                  {feedback === "incorrect" && "Not quite. Try reviewing the hints or see the answer."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hints Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              Hints ({hintsRevealed}/{hints.length})
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevealHint}
              disabled={hintsRevealed >= hints.length || showAnswer}
              className="bg-transparent"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Reveal Hint
            </Button>
          </div>

          {/* Progress bar for hints */}
          <Progress value={(hintsRevealed / hints.length) * 100} className="h-2" />

          {/* Revealed hints */}
          <div className="space-y-2">
            {hints.slice(0, hintsRevealed).map((hint, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-sm animate-fade-in-up"
              >
                <span className="font-medium text-yellow-500">Hint {index + 1}:</span> {hint}
              </div>
            ))}
          </div>
        </div>

        {/* Answer Section */}
        {showAnswer && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2 animate-fade-in-up">
            <p className="text-sm font-medium text-muted-foreground">Correct Answer:</p>
            <p>{answer}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleShowAnswer}
            disabled={showAnswer}
            className="text-muted-foreground gap-1"
          >
            {showAnswer ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showAnswer ? "Answer Shown" : "Show Answer"}
          </Button>

          <div className="flex gap-2">
            {!hasSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]">
                Continue Learning
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
