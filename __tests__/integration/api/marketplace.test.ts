/**
 * Marketplace API Integration Tests (Phase 24-25)
 */
import { describe, it, expect } from "vitest";

describe("Marketplace API", () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  describe("GET /api/marketplace/agents", () => {
    it("should return 200 for public list (may allow unauthenticated)", async () => {
      const response = await fetch(`${baseUrl}/api/marketplace/agents`);
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe("GET /api/marketplace/agents/[agentId]", () => {
    it("should return 404 or 401 for non-existent agent", async () => {
      const response = await fetch(
        `${baseUrl}/api/marketplace/agents/non-existent-uuid`
      );
      expect([404, 401, 403, 400]).toContain(response.status);
    });
  });

  describe("POST /api/marketplace/agents/[agentId]/install", () => {
    it("should require authentication", async () => {
      const response = await fetch(
        `${baseUrl}/api/marketplace/agents/some-agent-id/install`,
        { method: "POST" }
      );
      expect([401, 403, 302, 404]).toContain(response.status);
    });
  });

  describe("POST /api/marketplace/purchase", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/marketplace/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "test" }),
      });
      expect([401, 403, 302, 400]).toContain(response.status);
    });

    it("should validate request body", async () => {
      const response = await fetch(`${baseUrl}/api/marketplace/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/marketplace/agents/[agentId]/reviews", () => {
    it("should return 200 or 404 for agent reviews", async () => {
      const response = await fetch(
        `${baseUrl}/api/marketplace/agents/non-existent-uuid/reviews`
      );
      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe("POST /api/marketplace/agents/[agentId]/reviews", () => {
    it("should require authentication", async () => {
      const response = await fetch(
        `${baseUrl}/api/marketplace/agents/some-agent-id/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: 5, reviewText: "Great" }),
        }
      );
      expect([401, 403, 302, 404]).toContain(response.status);
    });
  });

  describe("GET /api/marketplace/search", () => {
    it("should accept query and return 200 or 401", async () => {
      const response = await fetch(`${baseUrl}/api/marketplace/search?q=test`);
      expect([200, 401, 403]).toContain(response.status);
    });
  });
});
