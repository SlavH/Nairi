"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, Loader2, Network, AlertTriangle, BookOpen, Cpu, Smartphone } from "lucide-react"
import { useBook } from "./book-context"
import { runPipeline, NoTextLayerError } from "@/lib/nairibook/pipeline"
import { loadSM2 } from "@/lib/nairibook/srs"
import { isWebGPUAvailable } from "@/lib/nairibook/embeddings"
import type { BookCore, ProcessingProgress } from "@/lib/nairibook/types"

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
import type { SM2State } from "@/lib/nairibook/srs"
import { ConceptGraphView } from "./concept-graph-view"

const STAGE_LABELS: Record<ProcessingProgress["stage"], string> = {
  idle: "Idle",
  parsing: "Reading document",
  chunking: "Splitting into chunks",
  embedding: "Computing embeddings",
  concepts: "Extracting concepts",
  graph: "Building graph",
  saving: "Saving locally",
  done: "Done",
  error: "Error",
}

export function ConceptMapPanel() {
  const { notebookTitle } = useBook()
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [core, setCore] = useState<BookCore | null>(null)
  const [srStates, setSrStates] = useState<Map<string, SM2State>>(new Map())
  const [running, setRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onFile = (f: File | null) => {
    setFile(f)
    setCore(null)
    setProgress(null)
    setSrStates(new Map())
  }

  const start = async () => {
    if (!file) {
      toast.error("Choose a PDF, EPUB, or text file first")
      return
    }
    const ac = new AbortController()
    abortRef.current = ac
    setRunning(true)
    setCore(null)
    setProgress({ stage: "parsing", message: "Starting…" })
    try {
      const result = await runPipeline(file, {
        signal: ac.signal,
        onProgress: (p) => setProgress(p),
      })
      setCore(result)
      const states = new Map<string, SM2State>()
      await Promise.all(
        result.graph.topological_order.map(async (cid) => {
          const st = await loadSM2(result.book_id, cid)
          if (st) states.set(cid, st)
        })
      )
      setSrStates(states)
      toast.success("Concept map built and saved locally.")
    } catch (err) {
      if ((err as Error).message?.includes("cancelled")) {
        toast.info("Processing cancelled.")
      } else if (err instanceof NoTextLayerError) {
        toast.error(err.message)
        setProgress({ stage: "error", message: err.message })
      } else {
        toast.error("Processing failed: " + (err as Error).message)
        setProgress({ stage: "error", message: (err as Error).message })
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
  }

  const STAGE_WEIGHTS: Record<string, number> = {
    parsing: 0.1,
    chunking: 0.05,
    embedding: 0.45,
    concepts: 0.3,
    graph: 0.05,
    saving: 0.05,
    done: 1,
    error: 0,
  }

  const pct = progress
    ? (() => {
        const stages = ["parsing", "chunking", "embedding", "concepts", "graph", "saving", "done"]
        const stageIdx = stages.indexOf(progress.stage)
        if (stageIdx < 0) return 0
        // Base percentage from completed stages
        let base = 0
        for (let i = 0; i < stageIdx; i++) base += (STAGE_WEIGHTS[stages[i]] ?? 0) * 100
        // Add proportional progress within current stage
        const stageWeight = STAGE_WEIGHTS[progress.stage] ?? 0
        if (progress.itemDone && progress.itemTotal && progress.itemTotal > 0) {
          base += stageWeight * (progress.itemDone / progress.itemTotal) * 100
        } else if (progress.chapterDone && progress.chapterTotal && progress.chapterTotal > 0) {
          base += stageWeight * (progress.chapterDone / progress.chapterTotal) * 100
        } else {
          base += stageWeight * 50 * 100 // estimate halfway through stage
        }
        return Math.min(100, Math.round(base))
      })()
    : 0

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Network className="h-5 w-5 text-[#22d3ee]" />
            Concept Map (local AI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Parses your book entirely in the browser — no upload to a server. Builds embeddings (WebGPU/WASM),
            extracts concepts per chapter via the free Zen API, and draws a prerequisite graph with a recommended
            study order. Results are saved locally (OPFS + IndexedDB).
          </p>

          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.epub,.txt,.md,application/pdf,application/epub+zip,text/plain,text/markdown"
              className="text-xs file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-foreground hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={running}>
              <Upload className="h-4 w-4 mr-1" />
              {file ? file.name : "Choose file"}
            </Button>
            {!running ? (
              <Button size="sm" onClick={start} disabled={!file || running} className="bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] text-white">
                <Network className="h-4 w-4 mr-1" />
                Build concept map
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={cancel}>
                Cancel
              </Button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Notebook: {notebookTitle}
          </p>

          {/* Early device capability warning */}
          {!running && !progress && !isWebGPUAvailable() && (
            <div className="flex items-start gap-2 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
              <Cpu className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                WebGPU is not available — embeddings will run on CPU (slower). 
                Enable hardware acceleration in your browser settings for better performance.
              </span>
            </div>
          )}
          {!running && !progress && isMobileDevice() && (
            <div className="flex items-start gap-2 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
              <Smartphone className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Processing on mobile may take several minutes. For best results, use a desktop browser with hardware acceleration enabled.
              </span>
            </div>
          )}

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {running && <Loader2 className="h-3 w-3 animate-spin" />}
                  {STAGE_LABELS[progress.stage]}
                </span>
                <span className="text-muted-foreground">{progress.message}</span>
              </div>
              <Progress value={pct} className="h-1.5" />
              {progress.stage === "concepts" && progress.chapterTotal && (
                <p className="text-[10px] text-muted-foreground">
                  Chapter {progress.chapterDone} / {progress.chapterTotal}
                </p>
              )}
              {/* WebGPU → WASM fallback warning */}
              {progress.device === "wasm" && (progress.stage === "embedding" || progress.stage === "concepts") && (
                <div className="flex items-start gap-2 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                  <Cpu className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Running on CPU (WASM) — WebGPU is not available. Embeddings are slower on CPU.
                    For best performance, use Chrome/Edge with hardware acceleration enabled.
                  </span>
                </div>
              )}
            </div>
          )}

          {progress?.stage === "error" && (
            <div className="flex items-start gap-2 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{progress.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {core && (
        <ConceptGraphView
          concepts={core.concepts}
          edges={core.graph.edges}
          topologicalOrder={core.graph.topological_order}
          cycleBreaks={core.graph.cycle_breaks}
          srStates={srStates}
        />
      )}

      {!core && !running && !progress && (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-12 text-center space-y-3">
            <Network className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">No concept map yet</p>
            <p className="text-xs text-muted-foreground">Upload a PDF above to generate a concept dependency graph.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
