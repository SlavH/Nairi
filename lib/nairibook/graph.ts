import type { Chunk, Concept, ConceptGraph, DependencyEdge, CycleBreak } from "./types"
import { callZen, tryParseJson } from "./zen"

const GRAPH_SCHEMA = {
  name: "concept_dependencies",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      edges: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            concept_id: { type: "string" },
            depends_on: { type: "array", items: { type: "string" } },
          },
          required: ["concept_id", "depends_on"],
        },
      },
    },
    required: ["edges"],
  },
}

// Build the dependency graph. To keep LLM calls bounded, we only ask the model
// about prerequisite relationships, passing the full concept list (concepts are
// short). We also add deterministic edges: if a concept's source chapter is
// strictly after another concept's chapter, that is a likely prerequisite.
export async function buildGraph(
  concepts: Concept[],
  chunks: Chunk[],
  signal?: AbortSignal
): Promise<ConceptGraph> {
  const byId = new Map(concepts.map((c) => [c.concept_id, c]))

  // 1. LLM-suggested dependencies.
  let llmEdges: DependencyEdge[] = []
  if (concepts.length > 1) {
    const prompt = `You are building a prerequisite graph for educational concepts.
A concept B "depends_on" concept A if a learner must understand A before B makes sense.
Given the concepts below (id + title), return dependency edges where depends_on lists prerequisite concept ids.
Only include genuine prerequisites. Avoid trivial or circular dependencies.

Concepts:
${concepts.map((c) => `- [${c.concept_id}] (chapter ${c.chapter}) ${c.title}`).join("\n")}

Return only the JSON object defined by the schema.`
    try {
      const res = await callZen(prompt, { schema: GRAPH_SCHEMA, maxTokens: 2048, signal })
      const parsed = (res.parsed ?? tryParseJson(res.content)) as any
      if (parsed?.edges) {
        llmEdges = parsed.edges
          .filter((e: any) => byId.has(e.concept_id) && Array.isArray(e.depends_on))
          .map((e: any) => ({
            concept_id: e.concept_id,
            depends_on: e.depends_on.filter((d: string) => byId.has(d) && d !== e.concept_id),
          }))
      }
    } catch {
      /* fall back to deterministic edges only */
    }
  }

  // 2. Deterministic edges: chapter-order prerequisite. A concept in a later
  // chapter depends on the nearest earlier concept (cheap, always-available).
  const deterministic = new Map<string, string[]>()
  const sortedByChapter = [...concepts].sort((a, b) => a.chapter - b.chapter)
  for (let i = 1; i < sortedByChapter.length; i++) {
    const prev = sortedByChapter[i - 1]
    const cur = sortedByChapter[i]
    if (cur.chapter !== prev.chapter) {
      deterministic.set(cur.concept_id, [prev.concept_id])
    }
  }

  // Merge: prefer LLM deps, fill missing with deterministic.
  const edgeMap = new Map<string, Set<string>>()
  for (const e of llmEdges) {
    if (!edgeMap.has(e.concept_id)) edgeMap.set(e.concept_id, new Set())
    e.depends_on.forEach((d: string) => edgeMap.get(e.concept_id)!.add(d))
  }
  for (const [cid, deps] of deterministic) {
    if (!edgeMap.has(cid)) edgeMap.set(cid, new Set(deps))
  }

  let edges: DependencyEdge[] = [...edgeMap.entries()].map(([concept_id, s]) => ({
    concept_id,
    depends_on: [...s],
  }))

  // 3. Cycle detection + heuristic break (by chapter/position order).
  const { edges: acyclic, cycle_breaks } = resolveCycles(edges, byId)

  // 4. Topological sort (Kahn's algorithm) for recommended study order.
  const topological_order = topologicalSort(acyclic, concepts.map((c) => c.concept_id))

  return { concepts, edges: acyclic, topological_order, cycle_breaks }
}

// Detect cycles via DFS coloring; break any cycle by removing the edge that
// goes "backwards" relative to concept chapter/position order. Logs breaks.
function resolveCycles(edges: DependencyEdge[], byId: Map<string, Concept>): {
  edges: DependencyEdge[]
  cycle_breaks: CycleBreak[]
} {
  const adj = new Map<string, string[]>()
  edges.forEach((e) => adj.set(e.concept_id, [...e.depends_on]))

  const order = (id: string): number => {
    const c = byId.get(id)
    return c ? c.chapter * 1000 + (parseInt(c.concept_id.split("-").pop() || "0", 10) || 0) : 0
  }

  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map<string, number>()
  adj.forEach((_, k) => color.set(k, WHITE))
  const breaks: CycleBreak[] = []

  const dfs = (u: string): boolean => {
    color.set(u, GRAY)
    for (const v of adj.get(u) ?? []) {
      if (!adj.has(v)) continue
      if (color.get(v) === GRAY) {
        // Back-edge => cycle. Break it if v appears before u in study order.
        if (order(v) < order(u)) {
          adj.set(u, (adj.get(u) ?? []).filter((x) => x !== v))
          breaks.push({
            concept_id: u,
            removed_dep: v,
            reason: "Removed back-edge to earlier concept to keep DAG (heuristic).",
          })
        }
        continue
      }
      if (color.get(v) === WHITE) {
        if (dfs(v)) return true
      }
    }
    color.set(u, BLACK)
    return false
  }

  for (const k of adj.keys()) {
    if (color.get(k) === WHITE) dfs(k)
  }
  // Re-run to ensure fully acyclic (may need multiple passes for complex cycles).
  // One pass suffices for simple cycles; for safety, repeat until stable.
  let guard = 0
  const WHITE2 = 0, GRAY2 = 1, BLACK2 = 2
  while (guard++ < 5) {
    const c2 = new Map<string, number>()
    adj.forEach((_, k) => c2.set(k, WHITE2))
    let changed = false
    const dfs2 = (u: string): boolean => {
      c2.set(u, GRAY2)
      for (const v of adj.get(u) ?? []) {
        if (!adj.has(v)) continue
        if (c2.get(v) === GRAY2) {
          adj.set(u, (adj.get(u) ?? []).filter((x) => x !== v))
          breaks.push({ concept_id: u, removed_dep: v, reason: "Removed back-edge (second pass)." })
          changed = true
          continue
        }
        if (c2.get(v) === WHITE2 && dfs2(v)) return true
      }
      c2.set(u, BLACK2)
      return false
    }
    for (const k of adj.keys()) if (c2.get(k) === WHITE2) dfs2(k)
    if (!changed) break
  }

  const result: DependencyEdge[] = [...adj.entries()].map(([concept_id, deps]) => ({
    concept_id,
    depends_on: deps,
  }))
  return { edges: result, cycle_breaks: breaks }
}

function topologicalSort(edges: DependencyEdge[], allConceptIds?: string[]): string[] {
  const indeg = new Map<string, number>()
  const adj = new Map<string, string[]>()
  // Seed every concept so isolated nodes still appear in the order.
  ;(allConceptIds ?? []).forEach((id) => {
    if (!indeg.has(id)) indeg.set(id, 0)
    if (!adj.has(id)) adj.set(id, [])
  })
  edges.forEach((e) => {
    if (!indeg.has(e.concept_id)) indeg.set(e.concept_id, 0)
    e.depends_on.forEach((d) => {
      if (!indeg.has(d)) indeg.set(d, 0)
      indeg.set(e.concept_id, (indeg.get(e.concept_id) ?? 0) + 1)
      if (!adj.has(d)) adj.set(d, [])
      adj.get(d)!.push(e.concept_id)
    })
  })
  const queue = [...indeg.entries()].filter(([, d]) => d === 0).map(([k]) => k)
  const order: string[] = []
  while (queue.length) {
    const n = queue.shift()!
    order.push(n)
    for (const m of adj.get(n) ?? []) {
      indeg.set(m, (indeg.get(m) ?? 1) - 1)
      if (indeg.get(m) === 0) queue.push(m)
    }
  }
  return order
}
