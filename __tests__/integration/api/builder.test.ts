/**
 * Builder API Integration Tests (Phase 22)
 * Note: Generate 200 test is skipped in CI when BITNET_BASE_URL is not set; use BYPASS_AUTH for local run.
 */
import { describe, it, expect } from "vitest";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const hasBitNet = Boolean(process.env.BITNET_BASE_URL?.trim());

describe("Builder API", () => {
  describe("POST /api/builder/generate", () => {
    it("should require authentication when bypass off", async () => {
      const response = await fetch(`${baseUrl}/api/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test" }),
      });

      expect([401, 403, 302]).toContain(response.status);
    });

    it("should validate request body (400 for missing prompt)", async () => {
      const response = await fetch(`${baseUrl}/api/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json().catch(() => ({}));
      expect(data.error).toBeDefined();
    });

    it("should return 200 and NDJSON stream when auth bypass and API key", async () => {
      if (!hasBitNet) {
        console.warn("Skipping generate 200 test: no BITNET_BASE_URL");
        return;
      }
      const response = await fetch(`${baseUrl}/api/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Hello world page",
          currentFiles: [],
          conversationHistory: [],
        }),
      });

      expect(response.status).toBe(200);
      const contentType = response.headers.get("content-type") ?? "";
      expect(contentType).toMatch(/text\/event-stream|application\/x-ndjson|application\/json/);
      const text = await response.text();
      const lines = text.trim().split("\n").filter(Boolean);
      expect(lines.length).toBeGreaterThan(0);
      const firstLine = lines[0];
      const first = JSON.parse(firstLine) as { type?: string };
      expect(["plan", "message", "task-update", "file-update", "complete", "error"]).toContain(first.type);
    }, 120000);
  });

  describe("GET /api/builder/projects", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/builder/projects`);

      expect([401, 403, 302]).toContain(response.status);
    });
  });

  describe("POST /api/builder/projects", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/builder/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test", files: [] }),
      });

      expect([401, 403, 302]).toContain(response.status);
    });
  });
});
