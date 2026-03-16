/**
 * Global Search System (Phase 60)
 * Unified search across all content types
 */
import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  type: "conversation" | "creation" | "agent" | "course" | "post" | "user";
  id: string;
  title: string;
  snippet: string;
  relevance: number;
}

export class GlobalSearch {
  /**
   * Search across all content types
   */
  static async search(
    query: string,
    userId: string,
    filters?: {
      types?: SearchResult["type"][];
      limit?: number;
    }
  ): Promise<SearchResult[]> {
    const supabase = await createClient();
    const results: SearchResult[] = [];
    const limit = filters?.limit || 20;

    const types = filters?.types || [
      "conversation",
      "creation",
      "agent",
      "course",
      "post",
      "user",
    ];

    // Search conversations
    if (types.includes("conversation")) {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, title")
        .eq("user_id", userId)
        .or(`title.ilike.%${query}%,id.ilike.%${query}%`)
        .limit(limit);

      results.push(
        ...(conversations || []).map((c) => ({
          type: "conversation" as const,
          id: c.id,
          title: c.title || "Untitled Conversation",
          snippet: "",
          relevance: 0.8,
        }))
      );
    }

    // Search creations
    if (types.includes("creation")) {
      const { data: creations } = await supabase
        .from("creations")
        .select("id, prompt, type")
        .eq("user_id", userId)
        .or(`prompt.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit);

      results.push(
        ...(creations || []).map((c) => ({
          type: "creation" as const,
          id: c.id,
          title: c.prompt?.substring(0, 50) || "Untitled Creation",
          snippet: c.prompt?.substring(0, 100) || "",
          relevance: 0.7,
        }))
      );
    }

    // Search agents
    if (types.includes("agent")) {
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, description")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      results.push(
        ...(agents || []).map((a) => ({
          type: "agent" as const,
          id: a.id,
          title: a.name,
          snippet: a.description?.substring(0, 100) || "",
          relevance: 0.9,
        }))
      );
    }

    // Search courses
    if (types.includes("course")) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, description")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      results.push(
        ...(courses || []).map((c) => ({
          type: "course" as const,
          id: c.id,
          title: c.title,
          snippet: c.description?.substring(0, 100) || "",
          relevance: 0.8,
        }))
      );
    }

    // Search posts
    if (types.includes("post")) {
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("id, content")
        .eq("visibility", "public")
        .ilike("content", `%${query}%`)
        .limit(limit);

      results.push(
        ...(posts || []).map((p) => ({
          type: "post" as const,
          id: p.id,
          title: p.content?.substring(0, 50) || "Post",
          snippet: p.content?.substring(0, 100) || "",
          relevance: 0.6,
        }))
      );
    }

    // Search users
    if (types.includes("user")) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      results.push(
        ...(profiles || []).map((p) => ({
          type: "user" as const,
          id: p.id,
          title: p.full_name || p.email || "User",
          snippet: p.email || "",
          relevance: 0.7,
        }))
      );
    }

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }
}
