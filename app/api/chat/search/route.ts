/**
 * Chat Search API (Phase 21)
 * Search conversations and messages
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const folderId = searchParams.get("folderId");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!query.trim()) {
      return NextResponse.json({ conversations: [], messages: [] });
    }

    // Search conversations by title/content
    let conversationsQuery = supabase
      .from("conversations")
      .select("id, title, created_at, updated_at, folder_id, tags")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,id.ilike.%${query}%`)
      .limit(limit);

    if (folderId) {
      conversationsQuery = conversationsQuery.eq("folder_id", folderId);
    }

    if (tags && tags.length > 0) {
      conversationsQuery = conversationsQuery.contains("tags", tags);
    }

    const { data: conversations, error: convError } = await conversationsQuery;

    if (convError) throw convError;

    // Search messages by content
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("id, conversation_id, role, content, created_at, conversations!inner(id, title, user_id)")
      .eq("conversations.user_id", userId)
      .ilike("content", `%${query}%`)
      .limit(limit);

    if (msgError) throw msgError;

    return NextResponse.json({
      conversations: conversations || [],
      messages: (messages || []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        conversationTitle: m.conversations?.title,
        role: m.role,
        content: m.content?.substring(0, 200), // Preview
        createdAt: m.created_at,
      })),
      query,
    });
  } catch (error) {
    return handleError(error);
  }
});
