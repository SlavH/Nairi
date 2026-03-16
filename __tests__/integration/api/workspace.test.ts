/**
 * Workspace API Integration Tests (Phase 23)
 */
import { describe, it, expect } from "vitest";

describe("Workspace API", () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  describe("GET /api/workspace/folders", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/workspace/folders`);

      expect([401, 403, 302]).toContain(response.status);
    });
  });

  describe("POST /api/workspace/folders", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/workspace/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });

      expect([401, 403, 302]).toContain(response.status);
    });

    it("should validate folder name", async () => {
      const response = await fetch(`${baseUrl}/api/workspace/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/workspace/search", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/workspace/search`);

      expect([401, 403, 302]).toContain(response.status);
    });
  });
});
