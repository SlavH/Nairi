// NairiBook core — data contract for chunks, concepts, and the dependency graph.
// This contract is the stable interface that future features (RAG chat, exercise
// generator, tutor) will read from. Do not change field names without updating
// those consumers.

export type BookFormat = "pdf" | "epub" | "text" | "markdown"

export interface ParsedChapter {
  index: number
  title: string
  level: number // heading depth (1 = top-level chapter, 2 = section, ...)
  text: string
}

export interface ParsedDocument {
  title: string
  format: BookFormat
  chapters: ParsedChapter[]
}

export interface Chunk {
  id: string // `c-{chapterIndex}-{position}`
  book_id: string
  chapter_index: number
  chapter_title: string
  position: number // global order of the chunk across the whole book
  start_offset: number // character offset within the chapter text
  end_offset: number
  text: string
}

export interface Concept {
  concept_id: string // `concept-{chapterIndex}-{n}`
  title: string
  description: string // 1-2 sentences
  chapter: number // chapter index the concept belongs to
  source_chunk_ids: string[]
}

export interface DependencyEdge {
  concept_id: string
  depends_on: string[] // concept_ids that should be understood first
}

export interface CycleBreak {
  concept_id: string
  removed_dep: string
  reason: string
}

export interface ConceptGraph {
  concepts: Concept[]
  edges: DependencyEdge[] // forms a DAG after cycle resolution
  topological_order: string[] // recommended study order (concept_ids)
  cycle_breaks: CycleBreak[] // logged heuristic breaks, for quality analysis
}

export interface BookCore {
  book_id: string
  title: string
  format: BookFormat
  created_at: number
  chapter_titles: string[]
  chunks: Chunk[]
  concepts: Concept[]
  graph: ConceptGraph
  // embeddings are stored separately in OPFS as parallel Float32Array
}

export interface ProcessingProgress {
  stage:
    | "idle"
    | "parsing"
    | "chunking"
    | "embedding"
    | "concepts"
    | "graph"
    | "saving"
    | "done"
    | "error"
  message: string
  chapterDone?: number
  chapterTotal?: number
  itemDone?: number
  itemTotal?: number
  /** Which compute device is being used for embeddings */
  device?: "webgpu" | "wasm"
}
