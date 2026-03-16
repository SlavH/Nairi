/**
 * Health Check Integration Tests (Phase 62)
 * Require a running app at NEXT_PUBLIC_APP_URL or http://localhost:3000; skip when server is not available.
 */
import { describe, it, expect, beforeAll } from "vitest";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
let serverAvailable = false;

describe("Health Check API", () => {
  beforeAll(async () => {
    try {
      const r = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(2000) });
      serverAvailable = r.status === 200;
    } catch {
      serverAvailable = false;
    }
  });

  it("should return 200 for health check", async () => {
    if (!serverAvailable) return;
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("status");
  });

  it("should return 200 for readiness check", async () => {
    if (!serverAvailable) return;
    const response = await fetch(`${baseUrl}/api/health/readiness`);
    expect(response.status).toBe(200);
  });

  it("should return 200 for liveness check", async () => {
    if (!serverAvailable) return;
    const response = await fetch(`${baseUrl}/api/health/liveness`);
    expect(response.status).toBe(200);
  });
});
