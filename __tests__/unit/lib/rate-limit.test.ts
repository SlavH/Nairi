/**
 * Rate Limit Tests (Phase 14)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Clear any existing rate limit entries
    vi.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const config = { maxRequests: 10, windowMs: 60000 };
      const identifier = "test-ip";

      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(identifier, config);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(10 - i - 1);
      }
    });

    it("should block requests over limit", () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      const identifier = "test-ip-2";

      // Make 5 requests (should succeed)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(identifier, config);
        expect(result.success).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = checkRateLimit(identifier, config);
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    it("should reset after window expires", async () => {
      const config = { maxRequests: 3, windowMs: 100 }; // 100ms window
      const identifier = "test-ip-3";

      // Exhaust limit
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      const blocked = checkRateLimit(identifier, config);
      expect(blocked.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const allowed = checkRateLimit(identifier, config);
      expect(allowed.success).toBe(true);
    });

    it("should track different identifiers separately", () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      // Exhaust limit for identifier 1
      checkRateLimit("ip-1", config);
      checkRateLimit("ip-1", config);
      const blocked1 = checkRateLimit("ip-1", config);
      expect(blocked1.success).toBe(false);

      // Identifier 2 should still be allowed
      const allowed2 = checkRateLimit("ip-2", config);
      expect(allowed2.success).toBe(true);
    });
  });

  describe("getClientIdentifier", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("192.168.1.1");
    });

    it("should use x-real-ip header if x-forwarded-for is missing", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-real-ip": "10.0.0.1" },
      });

      const identifier = getClientIdentifier(req);
      expect(identifier).toBe("10.0.0.1");
    });

    it("should fallback to user-agent hash", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "user-agent": "Mozilla/5.0" },
      });

      const identifier = getClientIdentifier(req);
      expect(identifier).toContain("ua-");
      expect(identifier.length).toBeGreaterThan(3);
    });
  });
});
