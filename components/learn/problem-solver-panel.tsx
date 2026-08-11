"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, Flame, RotateCcw, Network, BookOpen, Eye, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { useBook } from "./book-context"
import { listBooks, loadBookCore, type LoadedBook } from "@/lib/nairibook/store"
import {
  generateProblem,
  tutorReply,
  type Problem,
  type TutorTurn,
  type TutorReply,
  type SolveResult,
} from "@/lib/nairibook/problem"
import {
  getNextConcepts,
  loadSM2,
  applySolveResult,
  type SM2State,
} from "@/lib/nairibook/srs"
import {
  addXP,
  loadGamification,
  recordActiveDay,
  refillLives,
  saveGamification,
  streakAtRisk,
  type GamificationState,
} from "@/lib/nairibook/gamification"
import { MathMarkdown } from "./math-markdown"

type Phase = "select" | "solving" | "done"

export function ProblemSolverPanel() {
  const { notebookTitle, navigateToConcepts } = useBook()
  const [books, setBooks] = useState<{ book_id: string; title: string }[]>([])
  const [bookId, setBookId] = useState<string | null>(null)
  const [core, setCore] = useState<LoadedBook | null>(null)
  const [loadingBook, setLoadingBook] = useState(false)

  const [phase, setPhase] = useState<Phase>("select")
  const [gam, setGam] = useState<GamificationState | null>(null)
  const [srStates, setSrStates] = useState<Map<string, SM2State>>(new Map())
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const [problem, setProblem] = useState<Problem | null>(null)
  const [turns, setTurns] = useState<TutorTurn[]>([])
  const [reply, setReply] = useState<TutorReply | null>(null)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [struggles, setStruggles] = useState(0)
  const [result, setResult] = useState<SolveResult | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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
        setPhase("select")
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

  // Concepts the student has studied (completed) — problems only on these.
  const studiedConcepts = useMemo(() => {
    if (!core) return []
    return core.concepts.filter((c) => completed.has(c.concept_id) || srStates.has(c.concept_id))
  }, [core, completed, srStates])

  const startProblem = useCallback(async () => {
    if (!core || studiedConcepts.length === 0) {
      toast.info("Solve some exercises first to unlock concepts for problem practice.")
      return
    }
    setBusy(true)
    try {
      // Pick a studied concept (prefer one with a due review, else first).
      const queue = getNextConcepts(core.graph, srStates, completed)
      const pick =
        studiedConcepts.find((c) => queue[0]?.concept_id === c.concept_id) ?? studiedConcepts[0]
      const chapterChunks = core.chunks.filter((c) => c.chapter_index === pick.chapter)
      const chapterText = chapterChunks.map((c) => c.text).join("\n\n")
      const st = srStates.get(pick.concept_id)
      const prob = await generateProblem(
        core.book_id,
        [pick.concept_id],
        [pick.title],
        chapterText,
        { reviewCount: st?.review_count ?? 0, priorStatement: st ? "fresh variant" : undefined }
      )
      setProblem(prob)
      setTurns([])
      setReply(null)
      setStruggles(0)
      setResult(null)
      setShowSolution(false)
      setInput("")
      setPhase("solving")
    } catch (e) {
      toast.error("Could not generate problem: " + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }, [core, studiedConcepts, srStates, completed])

  const sendTurn = useCallback(
    async (text: string) => {
      if (!problem || busy) return
      const studentText = text.trim()
      if (!studentText) return
      setBusy(true)
      const newTurns: TutorTurn[] = [...turns, { role: "student", content: studentText }]
      setTurns(newTurns)
      setInput("")
      try {
        const r = await tutorReply(problem, newTurns, studentText, {
          style: "numeric",
          struggles,
        })
        setReply(r)
        setTurns((t) => [...t, { role: "tutor", content: r.message, step_index: r.step_index, advanced: r.advanced, needs_help: r.needs_help }])
        setStruggles((s) => (r.needs_help ? s + 1 : 0))

        // Detect "show solution" explicit request.
        const wantsSolution = /show\s+solution|я\s+сдаюсь|покажи\s+решение|дай\s+ответ|скажи\s+ответ/i.test(studentText)
        if (wantsSolution && !r.finished) {
          // Re-ask once with the reveal flag by appending a forced request.
          const reveal = await tutorReply(problem, [...newTurns, { role: "tutor", content: r.message }], "show solution", {
            style: "numeric",
            struggles: 5,
          })
          setReply(reveal)
          setTurns((t) => [...t, { role: "tutor", content: reveal.message, step_index: reveal.step_index, finished: reveal.finished }])
          setResult("shown")
          return
        }

        if (r.finished) {
          // Student reached the answer. Was it independent or with hints?
          setResult(struggles >= 3 ? "hinted" : "independent")
        }
      } catch (e) {
        toast.error("Tutor error: " + (e as Error).message)
      } finally {
        setBusy(false)
      }
    },
    [problem, busy, turns, struggles]
  )

  const finishWithShow = useCallback(async () => {
    if (!problem) return
    setShowSolution(true)
    const reveal = await tutorReply(problem, turns, "show solution", { style: "numeric", struggles: 5 })
    setReply(reveal)
    setTurns((t) => [...t, { role: "tutor", content: reveal.message, finished: true }])
    setResult("shown")
  }, [problem, turns])

  const finalize = useCallback(async () => {
    if (!core || !problem || !result || !gam) return
    const next = await applySolveResult(core.book_id, problem.concept_ids, result, srStates)
    setSrStates(next)
    // Mark concept completed only if not "shown".
    if (result !== "shown") {
      setCompleted((prev) => new Set(prev).add(problem.concept_ids[0]))
    }
    let g = recordActiveDay(refillLives(gam))
    g = addXP(g, result === "independent")
    await saveGamification(g)
    setGam(g)
    setPhase("done")
  }, [core, problem, result, gam, srStates])

  const risk = gam ? streakAtRisk(gam) : false
  const totalSteps = problem?.expected_solution_steps.length ?? 0
  const stepProgress = reply && totalSteps > 0 ? Math.min(100, Math.round(((reply.step_index + 1) / totalSteps) * 100)) : 0

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MessageSquare className="h-5 w-5 text-[#a78bfa]" />
            Problem Solver (Socratic tutor)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Generate a problem from a concept you've studied. The tutor guides you step by step and
            never reveals the answer — you derive it yourself. LaTeX is supported (e.g. $F = ma$).
          </p>

          <div className="flex items-center gap-2">
            <select
              value={bookId ?? ""}
              onChange={(e) => setBookId(e.target.value || null)}
              className="bg-white/10 border border-white/20 rounded-md px-2 py-1.5 text-xs text-foreground"
              disabled={loadingBook}
              aria-label="Select book for problem solving"
            >
              {books.length === 0 && <option value="">No processed books</option>}
              {books.map((b) => (
                <option key={b.book_id} value={b.book_id} className="bg-background text-foreground">
                  {b.title}
                </option>
              ))}
            </select>
            {loadingBook && <Loader2 className="h-4 w-4 animate-spin" />}
            <p className="text-[10px] text-muted-foreground">Notebook: {notebookTitle}</p>
            {books.length === 0 && (
              <Button variant="outline" size="sm" onClick={() => navigateToConcepts()} className="border-[#22d3ee]/50 text-[#22d3ee]">
                <Network className="h-3.5 w-3.5 mr-1" /> Process a PDF
              </Button>
            )}
          </div>

          {gam && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-[#fbbf24]"><Zap className="h-4 w-4" /> {gam.xp} XP</span>
              <span className="flex items-center gap-1.5 text-orange-400"><Flame className="h-4 w-4" /> {gam.daily_streak}d{risk && <Badge variant="outline" className="ml-1 text-[10px] border-orange-400/40 text-orange-300">streak at risk</Badge>}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {phase === "select" && (
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              {studiedConcepts.length === 0
                ? "Solve exercises on a concept first to unlock problem practice."
                : `Ready: ${studiedConcepts.length} studied concept(s) available for practice.`}
            </p>
            <Button
              className="w-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] text-white"
              onClick={startProblem}
              disabled={busy || studiedConcepts.length === 0}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <MessageSquare className="h-4 w-4 mr-1" />}
              New problem
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "solving" && problem && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#22d3ee]" /> Problem
                <Badge variant="secondary" className="text-[10px]">{problem.difficulty}</Badge>
              </CardTitle>
              {totalSteps > 0 && <span className="text-xs text-muted-foreground">Step {Math.min((reply?.step_index ?? 0) + 1, totalSteps)} / {totalSteps}</span>}
            </div>
            {totalSteps > 0 && <Progress value={stepProgress} className="h-1.5 mt-2" />}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-white/5 border border-white/10 p-3">
              <MathMarkdown className="text-sm text-foreground">{problem.problem_statement}</MathMarkdown>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {turns.filter((t) => t.role !== "system").map((t, i) => (
                <div key={i} className={`flex ${t.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${t.role === "student" ? "bg-[#a78bfa]/20 border border-[#a78bfa]/20 text-foreground" : "bg-white/10 border border-white/20 text-foreground"}`}>
                    <MathMarkdown>{t.content}</MathMarkdown>
                  </div>
                </div>
              ))}
              {busy && <div className="flex justify-start"><div className="rounded-lg px-3 py-2 bg-white/10 border border-white/20"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div></div>}
            </div>

            {/* Student input with LaTeX preview */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !busy) sendTurn(input) }}
                  placeholder="Your reasoning… (LaTeX: $F = ma$)"
                  className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-foreground"
                  disabled={busy}
                />
                <Button size="sm" onClick={() => setShowPreview((v) => !v)} variant="outline"><Eye className="h-3.5 w-3.5" /></Button>
                <Button size="sm" onClick={() => sendTurn(input)} disabled={busy || !input.trim()}>Send</Button>
              </div>
              {showPreview && input.trim() && (
                <div className="rounded-md bg-white/5 border border-white/10 p-2">
                  <MathMarkdown className="text-xs text-foreground">{input}</MathMarkdown>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={finishWithShow} disabled={busy}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Show solution
              </Button>
              {(reply?.finished || result) && (
                <Button size="sm" onClick={finalize}>Finish</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "done" && (
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-3 text-center">
            <div className={`text-xl font-bold ${result === "independent" ? "text-green-400" : result === "hinted" ? "text-yellow-400" : "text-rose-400"}`}>
              {result === "independent" ? "Solved independently!" : result === "hinted" ? "Solved with hints" : "Solution shown"}
            </div>
            <p className="text-xs text-muted-foreground">
              {result === "shown"
                ? "Marked as solved-with-help. Practice again later to build independence."
                : "Your SM-2 schedule for this concept was updated."}
            </p>
            <Button className="w-full" onClick={() => { setPhase("select"); setProblem(null); }}>
              <RotateCcw className="h-4 w-4 mr-1" /> Back
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
