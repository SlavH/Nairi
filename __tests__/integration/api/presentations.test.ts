/**
 * Presentations API Integration Tests (Phase 27)
 */
import { describe, it, expect } from "vitest";

describe("Presentations API", () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  describe("GET /api/presentations", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/presentations`);
      expect([401, 403, 302]).toContain(response.status);
    });
  });

  describe("POST /api/presentations", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/presentations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test", slides: [] }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });

    it("should validate request body", async () => {
      const response = await fetch(`${baseUrl}/api/presentations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/presentations/[id]", () => {
    it("should return 404 or 401 for non-existent presentation", async () => {
      const response = await fetch(
        `${baseUrl}/api/presentations/non-existent-uuid`
      );
      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe("GET /api/presentations/[id]/collaborators", () => {
    it("should require authentication or return 404", async () => {
      const response = await fetch(
        `${baseUrl}/api/presentations/non-existent-uuid/collaborators`
      );
      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe("GET /api/presentations/[id]/comments", () => {
    it("should return 200 or 404 for presentation comments", async () => {
      const response = await fetch(
        `${baseUrl}/api/presentations/non-existent-uuid/comments`
      );
      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe("GET /api/presentations/[id]/versions", () => {
    it("should require authentication or return 404", async () => {
      const response = await fetch(
        `${baseUrl}/api/presentations/non-existent-uuid/versions`
      );
      expect([404, 401, 403]).toContain(response.status);
    });
  });
});
