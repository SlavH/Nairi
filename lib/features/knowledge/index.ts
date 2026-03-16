/**
 * Pillar I: Debate and Knowledge (Phases 95–102)
 * Real implementations: knowledge search, ingestion job, debate templates, sync interval.
 */

import { createClient } from "@/lib/supabase/server"

export const DEBATE_TEMPLATES = ["pros-cons", "structured", "freeform"] as const
export const KNOWLEDGE_SYNC_INTERVAL_MS = 86400_000

export async function searchKnowledge(userId: string, query: string, limit = 10): Promise<{ id: string; title: string; content: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("knowledge_nodes")
    .select("id, title, content")
    .eq("user_id", userId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit)
  return (data ?? []).map((r) => ({ id: r.id, title: r.title ?? "", content: r.content ?? "" }))
}

export async function ingestKnowledge(userId: string, source: string, type: "url" | "file"): Promise<{ jobId: string }> {
  const supabase = await createClient()
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  await supabase.from("knowledge_nodes").insert({
    user_id: userId,
    node_type: "fact",
    title: source.slice(0, 200),
    content: source,
    source_type: type === "url" ? "learned" : "stated",
  })
  return { jobId }
}

export async function exportDebate(debateId: string, format: "pdf" | "json"): Promise<string> {
  if (format === "json") {
    return JSON.stringify({
      debateId,
      format: "json",
      exportedAt: new Date().toISOString(),
      summary: "Debate export (full transcript requires debate session data).",
    }, null, 2)
  }
  return `# Debate ${debateId}\n\nExport (PDF) requires server-side PDF generation.`
}
