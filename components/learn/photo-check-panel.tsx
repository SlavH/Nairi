"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Camera, Check, X, Eye, AlertTriangle, KeyRound, Network } from "lucide-react"
import { toast } from "sonner"
import { useBook } from "./book-context"
import { listBooks, loadBookCore, type LoadedBook } from "@/lib/nairibook/store"
import {
  generateProblem,
  loadProblemCache,
  type Problem,
} from "@/lib/nairibook/problem"
import {
  assessPhoto,
  preprocessImage,
  VisionUnavailableError,
  type PhotoFeedback,
} from "@/lib/nairibook/photo-check"
import { MathMarkdown } from "./math-markdown"

type Phase = "setup" | "capturing" | "result"

export function PhotoCheckPanel() {
  const { notebookTitle, navigateToConcepts } = useBook()
  const [books, setBooks] = useState<{ book_id: string; title: string }[]>([])
  const [bookId, setBookId] = useState<string | null>(null)
  const [core, setCore] = useState<LoadedBook | null>(null)
  const [loadingBook, setLoadingBook] = useState(false)

  const [phase, setPhase] = useState<Phase>("setup")
  const [problem, setProblem] = useState<Problem | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<PhotoFeedback | null>(null)
  const [needsKey, setNeedsKey] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [showSolutionContext, setShowSolutionContext] = useState(false)

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
      if (c) setPhase("setup")
    } catch (e) {
      toast.error("Failed to load book: " + (e as Error).message)
    } finally {
      setLoadingBook(false)
    }
  }, [])

  useEffect(() => {
    if (bookId) loadBook(bookId)
  }, [bookId, loadBook])

  const studiedConcepts = useMemo(() => {
    if (!core) return []
    // Any concept that has a cached problem, or all concepts as fallback.
    return core.concepts
  }, [core])

  const prepareProblem = useCallback(async () => {
    if (!core || studiedConcepts.length === 0) {
      toast.info("Process a book first to get a problem.")
      return
    }
    setBusy(true)
    try {
      const pick = studiedConcepts[0]
      const cached = await loadProblemCache(core.book_id, pick.concept_id)
      let prob = cached
      if (!prob) {
        const chapterChunks = core.chunks.filter((c) => c.chapter_index === pick.chapter)
        const chapterText = chapterChunks.map((c) => c.text).join("\n\n")
        prob = await generateProblem(core.book_id, [pick.concept_id], [pick.title], chapterText)
      }
      setProblem(prob)
      setFeedback(null)
      setNeedsKey(false)
      setImagePreview(null)
      setImageData(null)
      setPhase("capturing")
    } catch (e) {
      toast.error("Could not prepare problem: " + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }, [core, studiedConcepts])

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return
    try {
      const dataUrl = await preprocessImage(file)
      setImagePreview(URL.createObjectURL(file))
      setImageData(dataUrl)
    } catch (e) {
      toast.error("Image preprocessing failed: " + (e as Error).message)
    }
  }, [])

  const runCheck = useCallback(async () => {
    if (!problem || !imageData || !core) return
    setBusy(true)
    setNeedsKey(false)
    try {
      const concept = core.concepts.find((c) => c.concept_id === problem.concept_ids[0])
      const chapterChunks = core.chunks.filter((c) => c.chapter_index === (concept?.chapter ?? -1))
      const chapterText = chapterChunks.map((c) => c.text).join("\n\n")
      const fb = await assessPhoto(problem, imageData, chapterText)
      setFeedback(fb)
      setPhase("result")
    } catch (e) {
      if (e instanceof VisionUnavailableError) {
        setNeedsKey(true)
        setPhase("result")
      } else {
        toast.error("Check failed: " + (e as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }, [problem, imageData, core])

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-[#22d3ee]" />
            Check Photo (handwritten solution)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Photograph or upload a handwritten solution. We transcribe the steps with a vision model,
            compare them to the expected solution, and tell you exactly where the reasoning first
            went wrong. Requires a vision-capable model.
          </p>
          <div className="flex items-center gap-2">
            <select
              value={bookId ?? ""}
              onChange={(e) => setBookId(e.target.value || null)}
              className="bg-white/10 border border-white/20 rounded-md px-2 py-1.5 text-xs text-foreground"
              disabled={loadingBook}
              aria-label="Select book for photo check"
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
        </CardContent>
      </Card>

      {/* Setup: pick/prepare a problem */}
      {phase === "setup" && (
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              We compare your photo against a generated problem. Prepare one first.
            </p>
            <Button className="w-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] text-white" onClick={prepareProblem} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
              Prepare a problem
            </Button>
            {busy && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating a practice problem…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Capturing: show problem + capture image */}
      {phase === "capturing" && problem && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#22d3ee]" /> Problem to solve
              <Badge variant="secondary" className="text-[10px]">{problem.difficulty}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-white/5 border border-white/10 p-3">
              <MathMarkdown className="text-sm text-foreground">{problem.problem_statement}</MathMarkdown>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4 mr-1" /> Camera / Upload
              </Button>
              <input
                type="file"
                accept="image/*"
                className="text-xs file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-foreground"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {imagePreview && (
              <div className="rounded-md border border-white/10 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="handwritten solution" className="max-h-64 w-full object-contain bg-black/20" />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setPhase("setup")}>Back</Button>
              <Button size="sm" onClick={runCheck} disabled={busy || !imageData}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Check solution
              </Button>
            </div>
            {busy && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing your handwritten solution with AI…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {phase === "result" && (
        <div className="space-y-4">
          {needsKey && (
            <Card className="bg-card/50 border-amber-500/30">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <KeyRound className="h-4 w-4" /> Vision model required
                </div>
                <p className="text-xs text-muted-foreground">
                  The current model can't read images. Connect your own API key for a vision-capable
                  model (Claude, GPT-4o, or Gemini) in Settings — it's stored locally in
                  <code className="mx-1 px-1 rounded bg-white/10">localStorage["opencode-config"].apiKey</code>
                  and sent to the OpenCode Zen endpoint. Then retry the photo check.
                </p>
                <Button variant="outline" size="sm" onClick={() => setPhase("capturing")}>Back to photo</Button>
              </CardContent>
            </Card>
          )}

          {feedback?.needs_retake && (
            <Card className="bg-card/50 border-yellow-500/30">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <AlertTriangle className="h-4 w-4" /> Photo too unclear
                </div>
                <p className="text-xs text-muted-foreground">
                  We couldn't read enough of your handwriting to grade reliably. Please retake the
                  photo in good light, framing the whole solution.
                </p>
                <Button variant="outline" size="sm" onClick={() => setPhase("capturing")}>Retake</Button>
              </CardContent>
            </Card>
          )}

          {feedback && !feedback.needs_retake && !needsKey && (
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  {feedback.all_matched ? (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/40"><Check className="h-3 w-3 mr-1" /> All steps correct</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40"><X className="h-3 w-3 mr-1" /> First error at step {feedback.first_diff?.index != null ? feedback.first_diff.index + 1 : "-"}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{feedback.correct_steps} correct step(s) before divergence</span>
                </div>

                {feedback.first_diff && (
                  <div className="rounded-md bg-white/5 border border-white/10 p-3 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Expected step {feedback.first_diff.index + 1}:
                      <div className="text-foreground mt-1"><MathMarkdown>{feedback.first_diff.expected}</MathMarkdown></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Your step:
                      <div className="text-foreground mt-1"><MathMarkdown>{feedback.first_diff.recognized}</MathMarkdown></div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{feedback.first_diff.error_type}</Badge>
                    <p className="text-sm text-foreground">{feedback.first_diff.explanation}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setPhase("capturing")}>Retake</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSolutionContext((v) => !v)}>Show expected steps</Button>
                </div>
                {showSolutionContext && problem && (
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    {problem.expected_solution_steps.map((s, i) => (
                      <li key={i} className={feedback.first_diff && i === feedback.first_diff.index ? "text-yellow-300" : "text-foreground"}>
                        <MathMarkdown>{s}</MathMarkdown>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
