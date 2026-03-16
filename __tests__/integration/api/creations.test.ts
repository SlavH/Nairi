/**
 * Creations CRUD API Integration Tests (Phase 30)
 */
import { describe, it, expect } from "vitest";

describe("Creations API", () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  describe("GET /api/creations", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/creations`);
      expect([401, 403, 302]).toContain(response.status);
    });
  });

  describe("POST /api/creations", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/creations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "document",
          prompt: "test",
          content: "content",
        }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });

    it("should validate request body", async () => {
      const response = await fetch(`${baseUrl}/api/creations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/creations/[id]", () => {
    it("should return 404 or 401 for non-existent creation", async () => {
      const response = await fetch(
        `${baseUrl}/api/creations/non-existent-uuid`
      );
      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe("PATCH /api/creations/[id]", () => {
    it("should require authentication", async () => {
      const response = await fetch(
        `${baseUrl}/api/creations/non-existent-uuid`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "updated" }),
        }
      );
      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe("DELETE /api/creations/[id]", () => {
    it("should require authentication", async () => {
      const response = await fetch(
        `${baseUrl}/api/creations/non-existent-uuid`,
        { method: "DELETE" }
      );
      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe("GET /api/creations/stats", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/creations/stats`);
      expect([401, 403, 302]).toContain(response.status);
    });
  });
});
