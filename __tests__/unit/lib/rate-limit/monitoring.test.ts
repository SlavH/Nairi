/**
 * Rate Limit Monitoring Tests (Phase 15)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimitMonitor } from "@/lib/rate-limit/monitoring";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("RateLimitMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordEvent", () => {
    it("should record rate limit event", async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await RateLimitMonitor.recordEvent(
        "/api/chat",
        "ip-123",
        false
      );

      expect(mockSupabase.insert).toHaveBeenCalled();
      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.endpoint).toBe("/api/chat");
      expect(insertCall.identifier).toBe("ip-123");
      expect(insertCall.blocked).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      mockSupabase.insert.mockRejectedValue(new Error("Table not found"));

      // Should not throw
      await expect(
        RateLimitMonitor.recordEvent("/api/chat", "ip-123", true)
      ).resolves.not.toThrow();
    });
  });

  describe("getEndpointStats", () => {
    it("should calculate statistics for endpoint", async () => {
      const mockEvents = [
        { blocked: false },
        { blocked: false },
        { blocked: true },
        { blocked: false },
      ];

      mockSupabase.gte.mockResolvedValue({
        data: mockEvents,
        error: null,
      });

      const stats = await RateLimitMonitor.getEndpointStats("/api/chat", "hour");

      expect(stats.totalRequests).toBe(4);
      expect(stats.blockedRequests).toBe(1);
      expect(stats.successRate).toBe(75);
    });

    it("should return 100% success rate when no requests", async () => {
      mockSupabase.gte.mockResolvedValue({
        data: [],
        error: null,
      });

      const stats = await RateLimitMonitor.getEndpointStats("/api/chat");

      expect(stats.totalRequests).toBe(0);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.successRate).toBe(100);
    });

    it("should handle errors gracefully", async () => {
      mockSupabase.gte.mockRejectedValue(new Error("Database error"));

      const stats = await RateLimitMonitor.getEndpointStats("/api/chat");

      expect(stats.totalRequests).toBe(0);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.successRate).toBe(100);
    });

    it("should filter by time period", async () => {
      mockSupabase.gte.mockResolvedValue({
        data: [],
        error: null,
      });

      await RateLimitMonitor.getEndpointStats("/api/chat", "day");

      const gteCall = mockSupabase.gte.mock.calls[0];
      const sinceDate = new Date(gteCall[1]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 1);

      expect(sinceDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });
  });
});
