/**
 * AI Provider Health Monitoring (Phase 36)
 * Monitors provider health and implements fallback logic
 */
import { createClient } from "@/lib/supabase/server";

export interface ProviderHealth {
  provider: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
}

export class ProviderHealthMonitor {
  private static healthCache: Map<string, ProviderHealth> = new Map();
  private static readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Check provider health
   */
  static async checkHealth(provider: string): Promise<ProviderHealth> {
    const cached = this.healthCache.get(provider);
    if (cached && Date.now() - cached.lastChecked.getTime() < this.CACHE_TTL) {
      return cached;
    }

    const startTime = Date.now();
    let status: ProviderHealth["status"] = "healthy";
    let errorRate = 0;

    try {
      // In production, would make actual API call to check health
      // For now, check recent error rate from usage_logs
      const supabase = await createClient();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: logs } = await supabase
        .from("usage_logs")
        .select("success")
        .eq("provider", provider)
        .gte("created_at", oneHourAgo);

      if (logs && logs.length > 0) {
        const failures = logs.filter((l) => !l.success).length;
        errorRate = (failures / logs.length) * 100;

        if (errorRate > 50) {
          status = "down";
        } else if (errorRate > 20) {
          status = "degraded";
        }
      }

      const responseTime = Date.now() - startTime;

      const health: ProviderHealth = {
        provider,
        status,
        responseTime,
        errorRate,
        lastChecked: new Date(),
      };

      this.healthCache.set(provider, health);
      return health;
    } catch {
      return {
        provider,
        status: "down",
        responseTime: Date.now() - startTime,
        errorRate: 100,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get healthy providers in priority order
   */
  static async getHealthyProviders(
    providers: string[]
  ): Promise<Array<{ provider: string; health: ProviderHealth }>> {
    const healthChecks = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        health: await this.checkHealth(provider),
      }))
    );

    return healthChecks
      .filter(({ health }) => health.status !== "down")
      .sort((a, b) => {
        // Sort by status (healthy first), then by response time
        if (a.health.status !== b.health.status) {
          return a.health.status === "healthy" ? -1 : 1;
        }
        return a.health.responseTime - b.health.responseTime;
      });
  }

  /**
   * Select best provider with fallback
   */
  static async selectProvider(
    preferredProviders: string[]
  ): Promise<string | null> {
    const healthy = await this.getHealthyProviders(preferredProviders);
    return healthy.length > 0 ? healthy[0].provider : null;
  }
}
