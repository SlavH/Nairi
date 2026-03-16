/**
 * Marketplace Recommendation Engine (Phase 41)
 * Provides agent recommendations based on user behavior.
 * Depends on migration 025_add_agents_is_published.sql (agents.is_published) for filtering; falls back to unfiltered if column missing.
 */
import { createClient } from "@/lib/supabase/server";

export interface Recommendation {
  agentId: string;
  score: number;
  reason: string;
}

export class RecommendationEngine {
  /**
   * Get recommendations for a user
   */
  static async getRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Recommendation[]> {
    const supabase = await createClient();

    // Get user's installed agents
    const { data: userAgents } = await supabase
      .from("user_agents")
      .select("agent_id")
      .eq("user_id", userId);

    const installedIds = new Set(userAgents?.map((ua) => ua.agent_id) || []);

    // Get user's usage patterns
    const { data: usage } = await supabase
      .from("usage_logs")
      .select("type, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    // Get trending agents (is_published may not exist if migration 025 not run; fallback to all)
    let query = supabase
      .from("agents")
      .select("id, category, usage_count, rating")
      .order("usage_count", { ascending: false })
      .limit(limit * 2);
    if (installedIds.size > 0) {
      query = query.not("id", "in", `(${Array.from(installedIds).join(",")})`);
    }
    let trendingResult = await query.eq("is_published", true);
    if (trendingResult.error && (trendingResult.error.code === "PGRST204" || String(trendingResult.error.message || "").includes("is_published"))) {
      trendingResult = await query;
    }
    if (trendingResult.error) {
      return [];
    }
    const { data: trending } = trendingResult;

    // Score agents based on various factors
    const recommendations: Recommendation[] = [];

    for (const agent of trending || []) {
      let score = 0;
      const reasons: string[] = [];

      // Trending boost
      if (agent.usage_count > 100) {
        score += 20;
        reasons.push("Trending");
      }

      // Rating boost
      if (agent.rating && agent.rating > 4) {
        score += 15;
        reasons.push("Highly rated");
      }

      // Category match with user's usage
      const userCategories = new Set(
        usage?.map((u) => u.metadata?.category).filter(Boolean) || []
      );
      if (userCategories.has(agent.category)) {
        score += 25;
        reasons.push("Matches your interests");
      }

      recommendations.push({
        agentId: agent.id,
        score,
        reason: reasons.join(", ") || "Recommended",
      });
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get trending agents
   */
  static async getTrending(limit: number = 10): Promise<string[]> {
    const supabase = await createClient();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let result = await supabase
      .from("agents")
      .select("id")
      .eq("is_published", true)
      .gte("created_at", oneWeekAgo)
      .order("usage_count", { ascending: false })
      .limit(limit);
    if (result.error && (result.error.code === "PGRST204" || String(result.error.message || "").includes("is_published"))) {
      result = await supabase
        .from("agents")
        .select("id")
        .gte("created_at", oneWeekAgo)
        .order("usage_count", { ascending: false })
        .limit(limit);
    }
    if (result.error) return [];
    const { data } = result;
    return data?.map((a) => a.id) || [];
  }
}
