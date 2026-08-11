"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, Flame, Heart, Check, X, RotateCcw, Network, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { useBook } from "./book-context"
import { listBooks, loadBookCore, type LoadedBook } from "@/lib/nairibook/store"
import { getExerciseSet, gradeLocally, gradeFillAnswer, type Exercise } from "@/lib/nairibook/exercises"
import {
  getNextConcepts,
  isUnlocked,
  lessonQuality,
  loadSM2,
  review,
  saveSM2,
  type SM2State,
} from "@/lib/nairibook/srs"
import {
  addXP,
  loadGamification,
  loseLife,
  recordActiveDay,
  refillLives,
  saveGamification,
  streakAtRisk,
  type GamificationState,
} from "@/lib/nairibook/gamification"

type Phase = "select" | "lesson" | "summary" | "failed"

interface BookMeta {
  book_id: string
  title: string
  concept_count: number
}

interface AnswerState {
  given: unknown
  correct: boolean | null // null = not yet graded
  reason?: string
}

export function ExercisesPanel() {
  const { notebookTitle, navigateToConcepts } = useBook()
  const [books, setBooks] = useState<BookMeta[]>([])
  const [bookId, setBookId] = useState<string | null>(null)
  const [core, setCore] = useState<LoadedBook | null>(null)
  const [loadingBook, setLoadingBook] = useState(false)

  const [phase, setPhase] = useState<Phase>("select")
  const [gam, setGam] = useState<GamificationState | null>(null)
  const [srStates, setSrStates] = useState<Map<string, SM2State>>(new Map())
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  // Lesson runtime
  const [conceptId, setConceptId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exIndex, setExIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerState[]>([])
  const [generating, setGenerating] = useState(false)
  const [lessonXP, setLessonXP] = useState(0)
  const [nextHint, setNextHint] = useState<string>("")

  // ---- book loading ----
  const persistCompleted = useCallback(async (ids: Set<string>) => {
    if (!bookId) return
    const g = await loadGamification(bookId)
    g.completed = Array.from(ids)
    await saveGamification(g)
  }, [bookId])

  useEffect(() => {
    if (bookId && completed.size > 0) persistCompleted(completed)
  }, [bookId, completed, persistCompleted])

  const refreshBooks = useCallback(async () => {
    try {
      const list = await listBooks()
      const processed = list.filter((b) => b.processed)
      setBooks(processed)
      if (!bookId && processed.length > 0) setBookId(processed[0].book_id)
    } catch {
      /* ignore */
    }
  }, [bookId])

  useEffect(() => {
    refreshBooks()
  }, [refreshBooks])

  const loadBook = useCallback(async (id: string) => {
    setLoadingBook(true)
    try {
      const c = await loadBookCore(id)
      setCore(c)
      if (c) {
        // hydrate SR states for all concepts
        const states = new Map<string, SM2State>()
        await Promise.all(
          c.graph.topological_order.map(async (cid) => {
            const st = await loadSM2(id, cid)
            if (st) states.set(cid, st)
          })
        )
        setSrStates(states)
        const g = await loadGamification(id)
        setGam(refillLives(g))
        setCompleted(new Set(g.completed))
        setPhase("select")
        setConceptId(null)
      }
    } catch (e) {
      toast.error("Failed to load book: " + (e as Error).message)
    } finally {
      setLoadingBook(false)
    }
  }, [])

  useEffect(() => {
    if (bookId) loadBook(bookId)
  }, [bookId, loadBook])

  // ---- scheduler ----
  const queue = useMemo(() => {
    if (!core) return []
    return getNextConcepts(core.graph, srStates, completed)
  }, [core, srStates, completed])

  const startNextLesson = useCallback(async () => {
    if (!core || queue.length === 0) {
      toast.info("Nothing to review right now — add a new book or wait for due reviews.")
      return
    }
    const next = queue[0]
    const concept = core.concepts.find((c) => c.concept_id === next.concept_id)
    if (!concept) return

    setGenerating(true)
    setConceptId(concept.concept_id)
    try {
      const chapterChunks = core.chunks.filter((c) => c.chapter_index === concept.chapter)
      const chapterText = chapterChunks.map((c) => c.text).join("\n\n")
      const st = srStates.get(concept.concept_id)
      const set = await getExerciseSet(core.book_id, concept, chapterText, {
        reviewCount: st?.review_count ?? 0,
      })
      setExercises(set.exercises)
      setAnswers(set.exercises.map(() => ({ given: undefined, correct: null })))
      setExIndex(0)
      setLessonXP(0)
      setPhase("lesson")
    } catch (e) {
      toast.error("Could not generate exercises: " + (e as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [core, queue, srStates])

  // ---- answering ----
  const current = exercises[exIndex]
  const currentAnswer = answers[exIndex]

  const submitAnswer = useCallback(
    async (given: unknown) => {
      if (!current || currentAnswer?.correct !== null) return
      let correct: boolean
      let reason: string | undefined

      if (current.type === "fill") {
        const chapterChunks = core!.chunks.filter((c) => c.chapter_index === (core!.concepts.find((c) => c.concept_id === current.concept_id)?.chapter ?? -1))
        const conceptText = chapterChunks.map((c) => c.text).join("\n\n")
        const grade = await gradeFillAnswer(current, String(given), conceptText)
        correct = grade.correct
        reason = grade.reason
      } else {
        correct = gradeLocally(current, given)
      }

      setAnswers((prev) => {
        const copy = [...prev]
        copy[exIndex] = { given, correct, reason }
        return copy
      })

      if (!correct && gam) setGam(loseLife(refillLives(gam)))
    },
    [current, currentAnswer, core, exIndex, gam]
  )

  const nextExercise = useCallback(() => {
    if (exIndex + 1 < exercises.length) {
      setExIndex((i) => i + 1)
    } else {
      finishLesson()
    }
  }, [exIndex, exercises.length])

  const finishLesson = useCallback(async () => {
    if (!core || !conceptId || !gam) return
    const correctCount = answers.filter((a) => a.correct === true).length
    const total = answers.length
    const q = lessonQuality(correctCount, total)
    const isNew = !srStates.has(conceptId)
    const isFailed = gam.lives <= 0 && correctCount < total

    // Update SM-2 (only if not failed-out)
    if (!isFailed) {
      const prev = srStates.get(conceptId)
      const st = review(prev, q, { book_id: core.book_id, concept_id: conceptId })
      await saveSM2(st)
      const newStates = new Map(srStates)
      newStates.set(conceptId, st)
      setSrStates(newStates)
      if (correctCount === total) {
        setCompleted((prev) => new Set(prev).add(conceptId))
      }
    }

    // Gamification
    let g = recordActiveDay(refillLives(gam))
    g = addXP(g, isNew)
    setLessonXP(isNew ? 20 : 5)
    await saveGamification(g)
    setGam(g)

    // Next hint
    const upcoming = getNextConcepts(core.graph, srStates, completed)
    const up = upcoming[0]
    if (up) {
      const c = core.concepts.find((x) => x.concept_id === up.concept_id)
      setNextHint(up.due ? `Next: review "${c?.title}"` : `Next: learn "${c?.title}"`)
    } else {
      setNextHint("All caught up!")
    }

    setPhase(isFailed ? "failed" : "summary")
  }, [core, conceptId, gam, answers, srStates, completed])

  // ---- header stats ----
  const risk = gam ? streakAtRisk(gam) : false

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-[#fbbf24]" />
            Exercises & Spaced Repetition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Generate Duolingo-style exercises from your book's concepts. MCQ, true/false, match and
            fill-in-the-blank are checked locally; free-text answers are graded by the model for meaning.
            SM-2 schedules reviews; due concepts come first.
          </p>

          {/* book picker */}
          <div className="flex items-center gap-2">
            <select
              value={bookId ?? ""}
              onChange={(e) => setBookId(e.target.value || null)}
              className="bg-white/10 border border-white/20 rounded-md px-2 py-1.5 text-xs text-foreground"
              disabled={loadingBook}
              aria-label="Select book for exercises"
            >
              {books.length === 0 && <option value="">No processed books</option>}
              {books.map((b) => (
                <option key={b.book_id} value={b.book_id} className="bg-background text-foreground">
                  {b.title}
                </option>
              ))}
            </select>
            {loadingBook && <Loader2 className="h-4 w-4 animate-spin" />}
            {books.length === 0 && (
              <>
                <Button variant="outline" size="sm" onClick={refreshBooks}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateToConcepts()} className="border-[#22d3ee]/50 text-[#22d3ee]">
                  <Network className="h-3.5 w-3.5 mr-1" /> Process a PDF
                </Button>
              </>
            )}
            <p className="text-[10px] text-muted-foreground">Notebook: {notebookTitle}</p>
          </div>

          {/* stats header */}
          {gam && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-[#fbbf24]">
                <Zap className="h-4 w-4" /> {gam.xp} XP
              </span>
              <span className="flex items-center gap-1.5 text-orange-400">
                <Flame className="h-4 w-4" /> {gam.daily_streak} day{ gam.daily_streak === 1 ? "" : "s" }
                {risk && <Badge variant="outline" className="ml-1 text-[10px] border-orange-400/40 text-orange-300">streak at risk</Badge>}
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <Heart className="h-4 w-4" /> {gam.lives}/{5}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* queue preview */}
      {core && phase === "select" && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4 text-[#22d3ee]" /> Up next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.length === 0 && <p className="text-xs text-muted-foreground">No concepts available.</p>}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {queue.slice(0, 8).map((n, i) => {
                const c = core.concepts.find((x) => x.concept_id === n.concept_id)
                const unlocked = isUnlocked(n.concept_id, completed, core.graph)
                return (
                  <div key={n.concept_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground w-4">{i + 1}.</span>
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={unlocked ? "text-foreground" : "text-muted-foreground"}>{c?.title}</span>
                    </span>
                    <Badge variant={n.due ? "destructive" : "secondary"} className="text-[10px]">
                      {n.due ? "Review" : unlocked ? "New" : "Locked"}
                    </Badge>
                  </div>
                )
              })}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] text-white"
              onClick={startNextLesson}
              disabled={generating || queue.length === 0}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
              {queue[0]?.due ? "Start review" : "Start lesson"}
            </Button>
            {generating && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating exercises for this concept…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* lesson */}
      {phase === "lesson" && current && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {core?.concepts.find((c) => c.concept_id === conceptId)?.title}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{exIndex + 1} / {exercises.length}</span>
            </div>
            <Progress value={((exIndex) / exercises.length) * 100} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <ExerciseView exercise={current} answer={currentAnswer} onSubmit={submitAnswer} />
            {currentAnswer?.correct !== null && (
              <FeedbackBox correct={currentAnswer!.correct!} reason={currentAnswer?.reason} />
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={nextExercise}
                disabled={currentAnswer?.correct === null}
              >
                {exIndex + 1 < exercises.length ? "Next" : "Finish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* summary */}
      {phase === "summary" && (
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-3 text-center">
            <div className="text-2xl font-bold text-[#fbbf24]">+{lessonXP} XP</div>
            <p className="text-sm text-muted-foreground">{nextHint}</p>
            <Button className="w-full" onClick={() => { setPhase("select"); setConceptId(null); }}>
              <RotateCcw className="h-4 w-4 mr-1" /> Back to queue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* failed */}
      {phase === "failed" && (
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-3 text-center">
            <div className="text-xl font-bold text-rose-400">Out of lives</div>
            <p className="text-xs text-muted-foreground">Lives refill over time. Come back soon!</p>
            <Button className="w-full" onClick={() => { setPhase("select"); setConceptId(null); }}>
              Back to queue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ExerciseView({
  exercise,
  answer,
  onSubmit,
}: {
  exercise: Exercise
  answer: AnswerState | undefined
  onSubmit: (given: unknown) => void
}) {
  const [text, setText] = useState("")
  const done = answer?.correct !== null

  if (exercise.type === "mc") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground">{exercise.prompt}</p>
        <div className="grid gap-2">
          {(exercise.options ?? []).map((opt) => {
            const chosen = answer?.given === opt
            const isCorrectOpt = exercise.correct === opt
            let cls = "border-white/20 bg-white/5 hover:bg-white/10"
            if (done) {
              if (isCorrectOpt) cls = "border-green-500/60 bg-green-500/10"
              else if (chosen) cls = "border-red-500/60 bg-red-500/10"
              else cls = "border-white/20 bg-white/5 opacity-60"
            }
            return (
              <button
                key={opt}
                disabled={done}
                onClick={() => onSubmit(opt)}
                className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${cls}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (exercise.type === "tf") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground">{exercise.statement}</p>
        <div className="flex gap-2">
          <Button variant={answer?.given === true ? "default" : "outline"} disabled={done} onClick={() => onSubmit(true)}>True</Button>
          <Button variant={answer?.given === false ? "default" : "outline"} disabled={done} onClick={() => onSubmit(false)}>False</Button>
        </div>
      </div>
    )
  }

  if (exercise.type === "fill") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-foreground whitespace-pre-wrap">{exercise.prompt}</p>
        <div className="flex gap-2">
          <input
            value={text}
            disabled={done}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your answer…"
            className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-foreground"
            onKeyDown={(e) => { if (e.key === "Enter" && text.trim() && !done) onSubmit(text.trim()) }}
          />
          <Button disabled={done || !text.trim()} onClick={() => onSubmit(text.trim())}>Check</Button>
        </div>
      </div>
    )
  }

  // match
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">Match each term with its definition:</p>
      <div className="grid gap-2">
        {(exercise.pairs ?? []).map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground w-32 shrink-0">{p.term}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-foreground">{p.definition}</span>
          </div>
        ))}
      </div>
      <Button disabled={done} onClick={() => onSubmit(exercise.pairs)}>Mark as matched</Button>
    </div>
  )
}

function FeedbackBox({ correct, reason }: { correct: boolean; reason?: string }) {
  return (
    <div className={`flex items-start gap-2 text-xs rounded-md p-2 ${correct ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
      {correct ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> : <X className="h-4 w-4 mt-0.5 shrink-0" />}
      <span>{reason ?? (correct ? "Correct!" : "Not quite.")}</span>
    </div>
  )
}
