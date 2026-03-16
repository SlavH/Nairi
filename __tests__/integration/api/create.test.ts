/**
 * Create / Generate API Integration Tests (Phase 29)
 */
import { describe, it, expect } from "vitest";

describe("Create / Generate API", () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  describe("POST /api/create", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "document", prompt: "test" }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });

    it("should validate request body", async () => {
      const response = await fetch(`${baseUrl}/api/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/generate-presentation", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/generate-presentation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "test", slides: 5 }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });

    it("should validate request body", async () => {
      const response = await fetch(`${baseUrl}/api/generate-presentation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/generate-image", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test" }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });
  });

  describe("POST /api/generate-document", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/generate-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test" }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });
  });
});
