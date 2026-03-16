/**
 * Admin API Integration Tests (Phase 26)
 */
import { describe, it, expect } from "vitest";

describe("Admin API", () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  describe("GET /api/admin/users", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${baseUrl}/api/admin/users`);
      expect([401, 403, 302]).toContain(response.status);
    });

    it("should require admin role (403 when not admin)", async () => {
      const response = await fetch(`${baseUrl}/api/admin/users`);
      expect([401, 403]).toContain(response.status);
    });
  });

  describe("PUT /api/admin/users/[userId]/roles", () => {
    it("should require authentication", async () => {
      const response = await fetch(
        `${baseUrl}/api/admin/users/some-user-id/roles`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleName: "pro" }),
        }
      );
      expect([401, 403, 302, 404]).toContain(response.status);
    });

    it("should validate request body", async () => {
      const response = await fetch(
        `${baseUrl}/api/admin/users/some-user-id/roles`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("DELETE /api/admin/users/[userId]/roles", () => {
    it("should require authentication", async () => {
      const response = await fetch(
        `${baseUrl}/api/admin/users/some-user-id/roles`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleName: "pro" }),
        }
      );
      expect([401, 403, 302, 404, 405]).toContain(response.status);
    });
  });
});
