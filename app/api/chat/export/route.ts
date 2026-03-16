/**
 * Chat Export API (Phase 21)
 * Export conversations in various formats (PDF, Markdown, JSON)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
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
    const conversationId = searchParams.get("conversationId");
    const format = searchParams.get("format") || "json"; // json, markdown, pdf

    if (!conversationId) {
      return handleError(validationError("conversationId is required"));
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (convError || !conversation) {
      return handleError(validationError("Conversation not found"));
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;

    // Format based on requested format
    switch (format) {
      case "markdown": {
        let markdown = `# ${conversation.title || "Conversation"}\n\n`;
        markdown += `Created: ${new Date(conversation.created_at).toLocaleString()}\n\n`;
        markdown += "---\n\n";

        for (const msg of messages || []) {
          const role = msg.role === "user" ? "**You**" : "**Assistant**";
          markdown += `${role}\n\n${msg.content}\n\n---\n\n`;
        }

        return new NextResponse(markdown, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="${conversation.title || "conversation"}.md"`,
          },
        });
      }

      case "json": {
        const exportData = {
          conversation: {
            id: conversation.id,
            title: conversation.title,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
          },
          messages: (messages || []).map((m) => ({
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })),
        };

        return NextResponse.json(exportData, {
          headers: {
            "Content-Disposition": `attachment; filename="${conversation.title || "conversation"}.json"`,
          },
        });
      }

      case "pdf": {
        // PDF generation would require a library like pdfkit or puppeteer
        // For now, return JSON with a note
        return NextResponse.json(
          {
            error: "PDF export not yet implemented",
            message: "Please use JSON or Markdown format",
          },
          { status: 501 }
        );
      }

      default:
        return handleError(validationError(`Unsupported format: ${format}`));
    }
  } catch (error) {
    return handleError(error);
  }
});
