/**
 * Test Helpers (Phase 61)
 * Utilities for testing
 */
import { createClient } from "@/lib/supabase/server";

export class TestHelpers {
  /**
   * Create test user
   */
  static async createTestUser(email: string, password: string = "test123456") {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }

  /**
   * Clean up test user
   */
  static async cleanupTestUser(userId: string) {
    const supabase = await createClient();
    // In test environment, would delete user and all related data
    await supabase.from("profiles").delete().eq("id", userId);
  }

  /**
   * Create test conversation
   */
  static async createTestConversation(userId: string, title: string = "Test Conversation") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Create test message
   */
  static async createTestMessage(
    conversationId: string,
    userId: string,
    content: string,
    role: "user" | "assistant" = "user"
  ) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Mock AI response
   */
  static mockAIResponse(content: string) {
    return {
      text: content,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }
}
