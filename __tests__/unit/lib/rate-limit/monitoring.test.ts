/**
 * Rate Limit Monitoring Tests (Phase 15)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimitMonitor } from "@/lib/rate-limit/monitoring";

// Mock Supabase client — chainable methods return mockSupabase
// Terminal methods return Promises
const mockSupabase: any = {
  from: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  // gte is the terminal method in getEndpointStats (no .single() or .order())
  gte: vi.fn(),
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
      await RateLimitMonitor.recordEvent(
        "/api/chat",
        "ip-123",
        false
      );

      expect(mockSupabase.insert).toHaveBeenCalled();
      const insertCall = (mockSupabase.insert.mock.calls[0] as any)[0];
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

      mockSupabase.eq.mockReturnValue(mockSupabase);
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
      mockSupabase.eq.mockReturnValue(mockSupabase);
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
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.gte.mockRejectedValue(new Error("Database error"));

      const stats = await RateLimitMonitor.getEndpointStats("/api/chat");

      expect(stats.totalRequests).toBe(0);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.successRate).toBe(100);
    });

    it("should filter by time period", async () => {
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.gte.mockResolvedValue({
        data: [],
        error: null,
      });

      await RateLimitMonitor.getEndpointStats("/api/chat", "day");

      // gte is called with (column, value) as two separate arguments
      const gteCall = mockSupabase.gte.mock.calls[0];
      expect(gteCall).toBeDefined();
      expect(gteCall[0]).toBe("created_at");
      const sinceDate = new Date(gteCall[1]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 1);

      expect(sinceDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });
  });
});
