/**
 * Feed Algorithm (Phase 54)
 * Implements personalized feed ranking
 */
import { createClient } from "@/lib/supabase/server";

export interface FeedPost {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  score: number;
}

export class FeedAlgorithm {
  /**
   * Rank posts for user feed
   */
  static async rankPosts(
    userId: string,
    posts: FeedPost[]
  ): Promise<FeedPost[]> {
    const supabase = await createClient();

    // Get user preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("feed_algorithm")
      .eq("user_id", userId)
      .single();

    const algorithm = preferences?.feed_algorithm || "relevance";

    switch (algorithm) {
      case "chronological":
        return this.chronologicalRank(posts);
      case "popular":
        return this.popularityRank(posts);
      case "relevance":
      default:
        return await this.relevanceRank(userId, posts);
    }
  }

  /**
   * Chronological ranking
   */
  private static chronologicalRank(posts: FeedPost[]): FeedPost[] {
    return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Popularity ranking
   */
  private static popularityRank(posts: FeedPost[]): FeedPost[] {
    return posts.sort((a, b) => b.score - a.score);
  }

  /**
   * Relevance ranking (personalized)
   */
  private static async relevanceRank(
    userId: string,
    posts: FeedPost[]
  ): Promise<FeedPost[]> {
    const supabase = await createClient();

    // Get user's following list
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followingIds = new Set(following?.map((f) => f.following_id) || []);

    // Score posts
    const scored = posts.map((post) => {
      let score = post.score;

      // Boost posts from followed users
      if (followingIds.has(post.userId)) {
        score *= 1.5;
      }

      // Boost recent posts
      const hoursSincePost = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
      const recencyBoost = Math.max(0, 1 - hoursSincePost / 24);
      score *= 1 + recencyBoost * 0.3;

      return { ...post, score };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Get personalized feed
   */
  static async getPersonalizedFeed(
    userId: string,
    limit: number = 50
  ): Promise<FeedPost[]> {
    const supabase = await createClient();

    // Get posts
    const { data: posts } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Get more to filter

    if (!posts) return [];

    const feedPosts: FeedPost[] = posts.map((p) => ({
      id: p.id,
      userId: p.user_id,
      content: p.content,
      createdAt: new Date(p.created_at),
      score: 0,
    }));

    const ranked = await this.rankPosts(userId, feedPosts);
    return ranked.slice(0, limit);
  }
}
