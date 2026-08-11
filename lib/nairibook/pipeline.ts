import type { BookCore, Concept, ProcessingProgress } from "./types"
import { parseDocument, NoTextLayerError } from "./parsers"
import { chunkDocument } from "./chunking"
import { embedChunks } from "./embeddings"
import { extractConceptsForChapter } from "./concepts"
import { buildGraph } from "./graph"
import { saveBookCore } from "./store"

export interface PipelineCallbacks {
  onProgress: (p: ProcessingProgress) => void
  signal?: AbortSignal
}

function uid(): string {
  return "book-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Full NairiBook core pipeline, client-side. Processes chapters incrementally:
// concepts/graph for early chapters become available as soon as they are done,
// while later chapters continue in the background. The orchestrator returns the
// final BookCore and also invokes onProgress with partial concept arrays so the
// UI can render results before the whole book finishes.
export async function runPipeline(
  file: File,
  cb: PipelineCallbacks
): Promise<BookCore> {
  const { onProgress, signal } = cb

  onProgress({ stage: "parsing", message: "Reading document…" })
  const parsed = await parseDocument(file, (m) => onProgress({ stage: "parsing", message: m }))

  const bookId = uid()
  onProgress({ stage: "chunking", message: "Splitting into structured chunks…" })
  const chunks = chunkDocument(parsed, bookId)

  onProgress({ stage: "embedding", message: "Computing embeddings (this may take a while on CPU)…" })
  const { vectors, device } = await embedChunks(chunks, (done, total) =>
    onProgress({ stage: "embedding", message: `Embedding ${done}/${total} chunks (${device === "webgpu" ? "WebGPU" : "WASM/CPU"})…`, itemDone: done, itemTotal: total })
  )

  // Incremental concept extraction, chapter by chapter.
  const concepts: Concept[] = []
  const chapterCount = parsed.chapters.length
  for (let ci = 0; ci < chapterCount; ci++) {
    if (signal?.aborted) throw new Error("Processing cancelled.")
    const chapterChunks = chunks.filter((c) => c.chapter_index === ci)
    onProgress({
      stage: "concepts",
      message: `Extracting concepts: chapter ${ci + 1} of ${chapterCount}…`,
      chapterDone: ci + 1,
      chapterTotal: chapterCount,
      device,
    })
    const chConcepts = await extractConceptsForChapter(ci, parsed.chapters[ci]?.title ?? `Chapter ${ci + 1}`, chapterChunks, signal)
    concepts.push(...chConcepts)
  }

  onProgress({ stage: "graph", message: "Building concept dependency graph…" })
  const graph = await buildGraph(concepts, chunks, signal)

  onProgress({ stage: "saving", message: "Saving to local storage (OPFS + IndexedDB)…" })
  const core: BookCore = {
    book_id: bookId,
    title: parsed.title,
    format: parsed.format,
    created_at: Date.now(),
    chapter_titles: parsed.chapters.map((c) => c.title),
    chunks,
    concepts,
    graph,
  }
  await saveBookCore(core, vectors)

  onProgress({ stage: "done", message: `Done. ${chunks.length} chunks, ${concepts.length} concepts, ${graph.edges.length} dependencies.` })
  return core
}

export { NoTextLayerError }
