/**
 * Context Management System (Phase 23)
 * Manages conversation context window and summarization
 */
import { createClient } from "@/lib/supabase/server";

export interface ContextSummary {
  summary: string;
  keyPoints: string[];
  messageCount: number;
  originalMessageCount: number;
}

export class ContextManager {
  private static readonly MAX_CONTEXT_MESSAGES = 50;
  private static readonly SUMMARY_THRESHOLD = 30;

  /**
   * Get messages with context management
   * Automatically summarizes old messages if conversation is too long
   */
  static async getMessagesWithContext(
    conversationId: string,
    userId: string
  ): Promise<{
    messages: Array<{ role: string; content: string }>;
    summary?: ContextSummary;
  }> {
    const supabase = await createClient();

    // Get all messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const messageCount = messages?.length || 0;

    // If conversation is short, return all messages
    if (messageCount <= this.MAX_CONTEXT_MESSAGES) {
      return {
        messages: (messages || []).map((m) => ({
          role: m.role,
          content: m.content || "",
        })),
      };
    }

    // Conversation is too long - need to summarize
    const messagesToKeep = messages?.slice(-this.MAX_CONTEXT_MESSAGES) || [];
    const messagesToSummarize = messages?.slice(0, messageCount - this.MAX_CONTEXT_MESSAGES) || [];

    // Get or create summary
    const summary = await this.getOrCreateSummary(
      conversationId,
      messagesToSummarize
    );

    return {
      messages: messagesToKeep.map((m) => ({
        role: m.role,
        content: m.content || "",
      })),
      summary,
    };
  }

  /**
   * Get or create summary for old messages
   */
  private static async getOrCreateSummary(
    conversationId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<ContextSummary> {
    const supabase = await createClient();

    // Check if summary exists in conversation metadata
    const { data: conversation } = await supabase
      .from("conversations")
      .select("metadata")
      .eq("id", conversationId)
      .single();

    if (conversation?.metadata?.contextSummary) {
      return conversation.metadata.contextSummary;
    }

    // Generate summary (this would use AI in production)
    const summary = await this.generateSummary(messages);

    // Store summary in conversation metadata
    await supabase
      .from("conversations")
      .update({
        metadata: {
          ...conversation?.metadata,
          contextSummary: summary,
        },
      })
      .eq("id", conversationId);

    return summary;
  }

  /**
   * Generate summary of messages
   */
  private static async generateSummary(
    messages: Array<{ role: string; content: string }>
  ): Promise<ContextSummary> {
    // In production, this would call an AI model to summarize
    // For now, return a placeholder
    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    return {
      summary: `Previous conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant responses.`,
      keyPoints: userMessages.slice(0, 5).map((m) => m.content.substring(0, 100)),
      messageCount: messages.length,
      originalMessageCount: messages.length,
    };
  }

  /**
   * Export context for import
   */
  static async exportContext(conversationId: string): Promise<string> {
    const supabase = await createClient();
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    return JSON.stringify({
      messages: messages?.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
      exportedAt: new Date().toISOString(),
    });
  }

  /**
   * Import context
   */
  static async importContext(
    conversationId: string,
    contextData: string
  ): Promise<void> {
    const data = JSON.parse(contextData);
    const supabase = await createClient();

    // Import messages (would need to handle conflicts)
    // This is a simplified version
    if (data.messages && Array.isArray(data.messages)) {
      // In production, would need to handle duplicates and ordering
    }
  }
}
