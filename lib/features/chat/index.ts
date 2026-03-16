/**
 * Pillar B: Chat and Conversations (Phases 19–32)
 * Real implementations: search, folders/tags, export, shared, templates, suggested replies.
 */

import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export const CONVERSATION_FOLDERS_ENABLED = process.env.NAIRI_CONVERSATION_FOLDERS !== "false"
export const CONVERSATION_TAGS_ENABLED = process.env.NAIRI_CONVERSATION_TAGS !== "false"

export const CHAT_TEMPLATES: { id: string; label: string; prompt: string }[] = [
  { id: "code-review", label: "Code review", prompt: "Review this code for correctness, style, and security." },
  { id: "summarize", label: "Summarize", prompt: "Summarize the following concisely." },
  { id: "explain", label: "Explain", prompt: "Explain this in simple terms." },
  { id: "improve", label: "Improve", prompt: "Improve this text for clarity and impact." },
]

export async function searchConversations(userId: string, query: string): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("user_id", userId)
    .ilike("title", `%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []).map((r) => ({ id: r.id, title: r.title ?? "New Conversation" }))
}

export async function exportConversation(
  conversationId: string,
  format: "markdown" | "json",
  supabase?: SupabaseClient
): Promise<string> {
  const client = supabase ?? (await createClient())
  const { data: conv } = await client.from("conversations").select("id, title").eq("id", conversationId).single()
  if (!conv) return ""
  const { data: messages } = await client
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
  if (format === "json") {
    return JSON.stringify({ title: conv.title, messages: messages ?? [] }, null, 2)
  }
  const lines = [`# ${conv.title}\n`]
  for (const m of messages ?? []) {
    lines.push(`## ${m.role}\n\n${m.content}\n`)
  }
  return lines.join("\n")
}

const SUGGESTED_PATTERNS: { pattern: RegExp; replies: string[] }[] = [
  { pattern: /code|function|script/i, replies: ["Explain this further", "Add tests", "Optimize it"] },
  { pattern: /summar/i, replies: ["Make it shorter", "Add bullet points", "Translate to Spanish"] },
  { pattern: /^.{0,100}$/, replies: ["Tell me more", "Give an example", "What are the alternatives?"] },
]

export function getSuggestedReplies(lastAssistantContent: string): string[] {
  for (const { pattern, replies } of SUGGESTED_PATTERNS) {
    if (pattern.test(lastAssistantContent)) return replies
  }
  return ["Tell me more", "Give an example", "Thanks"]
}

export async function getConversationFolders(userId: string): Promise<{ id: string; name: string }[]> {
  if (!CONVERSATION_FOLDERS_ENABLED) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from("conversation_folders")
    .select("id, name")
    .eq("user_id", userId)
    .order("name")
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }))
}

export async function createConversationFolder(userId: string, name: string): Promise<string | null> {
  if (!CONVERSATION_FOLDERS_ENABLED) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("conversation_folders")
    .insert({ user_id: userId, name })
    .select("id")
    .single()
  return error ? null : data?.id ?? null
}

export async function updateConversationFolder(
  folderId: string,
  userId: string,
  name: string
): Promise<boolean> {
  if (!CONVERSATION_FOLDERS_ENABLED) return false
  const supabase = await createClient()
  const { error } = await supabase
    .from("conversation_folders")
    .update({ name })
    .eq("id", folderId)
    .eq("user_id", userId)
  return !error
}

export async function deleteConversationFolder(folderId: string, userId: string): Promise<boolean> {
  if (!CONVERSATION_FOLDERS_ENABLED) return false
  const supabase = await createClient()
  const { error } = await supabase
    .from("conversation_folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", userId)
  return !error
}

export async function setConversationFolder(conversationId: string, userId: string, folderId: string | null): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("conversations")
    .update({ folder_id: folderId })
    .eq("id", conversationId)
    .eq("user_id", userId)
  return !error
}

export async function setConversationTags(conversationId: string, userId: string, tags: string[]): Promise<boolean> {
  if (!CONVERSATION_TAGS_ENABLED) return false
  const supabase = await createClient()
  const { error } = await supabase
    .from("conversations")
    .update({ tags })
    .eq("id", conversationId)
    .eq("user_id", userId)
  return !error
}

export async function createSharedLink(
  conversationId: string,
  userId: string,
  expiresInHours?: number
): Promise<{ slug: string; url: string } | null> {
  const supabase = await createClient()
  const slug = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    : null
  const { error } = await supabase
    .from("conversations")
    .update({ shared_slug: slug, shared_expires_at: expiresAt })
    .eq("id", conversationId)
    .eq("user_id", userId)
  if (error) return null
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return { slug, url: `${base}/share/chat/${slug}` }
}

export async function getSharedConversation(slug: string): Promise<{ id: string; title: string; messages: { role: string; content: string }[] } | null> {
  const supabase = await createClient()
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, title, shared_expires_at")
    .eq("shared_slug", slug)
    .single()
  if (!conv) return null
  if (conv.shared_expires_at && new Date(conv.shared_expires_at) < new Date()) return null
  const { data: messages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
  return { id: conv.id, title: conv.title ?? "Shared conversation", messages: messages ?? [] }
}

export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from("conversations").delete().eq("id", conversationId).eq("user_id", userId)
  return !error
}
