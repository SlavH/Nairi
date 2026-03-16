/**
 * GET /api/chat/conversations/[conversationId] — get messages for a conversation.
 * PATCH — pin/unpin. DELETE — delete conversation.
 * Auth required (or BYPASS_AUTH in dev). User can only access their own conversations.
 */

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserIdOrBypassForApi, getBypassUserId } from "@/lib/auth"
import { NextResponse } from "next/server"

async function getSupabaseAndUserId() {
  const supabase = await createClient()
  const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
  return { supabase, userId }
}

function clientForConversation(userId: string) {
  return userId === getBypassUserId() ? createAdminClient() : null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
  }

  const { supabase, userId } = await getSupabaseAndUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = clientForConversation(userId)
  const convClient = admin ?? supabase
  const { data: conv, error: convError } = await convClient
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .single()

  if (convError || !conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }
  if (conv.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const msgClient = admin ?? supabase
  const { data: messages, error } = await msgClient
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversationId, messages: messages ?? [] })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
  }

  const { supabase, userId } = await getSupabaseAndUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { is_pinned?: boolean; folder_id?: string | null; title?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const isPinned = body.is_pinned
  const folderId = body.folder_id
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 255) : undefined
  const hasPinned = typeof isPinned === "boolean"
  const hasFolder = folderId !== undefined
  const hasTitle = title !== undefined
  if (!hasPinned && !hasFolder && !hasTitle) {
    return NextResponse.json({ error: "Provide is_pinned (boolean), folder_id (string | null), and/or title (string)" }, { status: 400 })
  }

  const admin = clientForConversation(userId)
  const client = admin ?? supabase
  const { data: conv, error: convError } = await client
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .single()

  if (convError || !conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }
  if (conv.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updates: { is_pinned?: boolean; pinned_at?: string | null; folder_id?: string | null; title?: string; updated_at?: string } = {}
  if (hasPinned) {
    updates.is_pinned = isPinned
    updates.pinned_at = isPinned ? new Date().toISOString() : null
  }
  if (hasFolder) {
    updates.folder_id = folderId === null || folderId === "" ? null : folderId
  }
  if (hasTitle) {
    updates.title = title || "New Conversation"
    updates.updated_at = new Date().toISOString()
  }

  const { error: updateError } = await client
    .from("conversations")
    .update(updates)
    .eq("id", conversationId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
  }

  const { supabase, userId } = await getSupabaseAndUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = clientForConversation(userId)
  const client = admin ?? supabase
  const { data: conv, error: convError } = await client
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .single()

  if (convError || !conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }
  if (conv.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error: deleteError } = await client.from("conversations").delete().eq("id", conversationId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
