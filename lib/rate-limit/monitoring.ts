/**
 * Rate Limit Monitoring (Phase 6)
 * Tracks rate limit usage and provides analytics
 */
import { createClient } from "@/lib/supabase/server";

export interface RateLimitMetrics {
  endpoint: string;
  identifier: string;
  totalRequests: number;
  blockedRequests: number;
  period: string;
  timestamp: Date;
}

export class RateLimitMonitor {
  /**
   * Record rate limit event
   */
  static async recordEvent(
    endpoint: string,
    identifier: string,
    blocked: boolean
  ): Promise<void> {
    // In production, this would write to a monitoring service
    // For now, we'll use the database if a table exists
    try {
      const supabase = await createClient();
      await supabase.from("rate_limit_events").insert({
        endpoint,
        identifier,
        blocked,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Table doesn't exist yet or monitoring disabled
      // This is fine - monitoring is optional
    }
  }

  /**
   * Get rate limit statistics for an endpoint
   */
  static async getEndpointStats(
    endpoint: string,
    period: "hour" | "day" = "hour"
  ): Promise<{
    totalRequests: number;
    blockedRequests: number;
    successRate: number;
  }> {
    try {
      const supabase = await createClient();
      const since = new Date();
      if (period === "hour") {
        since.setHours(since.getHours() - 1);
      } else {
        since.setDate(since.getDate() - 1);
      }

      const { data, error } = await supabase
        .from("rate_limit_events")
        .select("*")
        .eq("endpoint", endpoint)
        .gte("created_at", since.toISOString());

      if (error) throw error;

      const totalRequests = data?.length || 0;
      const blockedRequests =
        data?.filter((e) => e.blocked).length || 0;
      const successRate =
        totalRequests > 0
          ? ((totalRequests - blockedRequests) / totalRequests) * 100
          : 100;

      return {
        totalRequests,
        blockedRequests,
        successRate,
      };
    } catch {
      return {
        totalRequests: 0,
        blockedRequests: 0,
        successRate: 100,
      };
    }
  }
}
