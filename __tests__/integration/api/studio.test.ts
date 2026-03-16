/**
 * Studio API Integration Tests (Phase 28)
 */
import { describe, it, expect } from "vitest";

describe("Studio API", () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  describe("GET /api/studio/gallery", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/studio/gallery`);
      expect([401, 403, 302]).toContain(response.status);
    });
  });

  describe("POST /api/studio/gallery", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/studio/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", url: "https://example.com/img.png" }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });
  });

  describe("POST /api/studio/generate", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/studio/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test" }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });

    it("should validate request body", async () => {
      const response = await fetch(`${baseUrl}/api/studio/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/studio/image", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/studio/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test" }),
      });
      expect([401, 403, 302]).toContain(response.status);
    });
  });
});
