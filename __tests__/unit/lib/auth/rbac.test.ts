/**
 * RBAC Manager Tests (Phase 13)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RBACManager } from "@/lib/auth/rbac";

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("RBACManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hasPermission", () => {
    it("should return true when user has permission", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await RBACManager.hasPermission(
        "user-123",
        "chat.create"
      );

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("user_has_permission", {
        p_user_id: "user-123",
        p_permission_name: "chat.create",
      });
    });

    it("should return false when user lacks permission", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await RBACManager.hasPermission(
        "user-123",
        "admin.users.delete"
      );

      expect(result).toBe(false);
    });

    it("should throw error on RPC failure", async () => {
      const rpcError = { code: "PGRST202", message: "RPC error" };
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: rpcError,
      });

      await expect(
        RBACManager.hasPermission("user-123", "chat.create")
      ).rejects.toEqual(rpcError);
    });
  });

  describe("getUserRoles", () => {
    it("should retrieve user roles", async () => {
      const mockRoleData = [
        { role_name: "user", role_level: 1 },
        { role_name: "pro", role_level: 2 },
      ];

      const mockRoles = [
        { id: "role-1", name: "user", description: "Standard user", level: 1 },
        { id: "role-2", name: "pro", description: "Pro subscriber", level: 2 },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockRoleData,
        error: null,
      });

      mockSupabase.in.mockResolvedValue({
        data: mockRoles,
        error: null,
      });

      const roles = await RBACManager.getUserRoles("user-123");

      expect(roles).toHaveLength(2);
      expect(roles[0].name).toBe("user");
      expect(roles[1].name).toBe("pro");
    });

    it("should return empty array when user has no roles", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const roles = await RBACManager.getUserRoles("user-123");

      expect(roles).toEqual([]);
    });
  });

  describe("assignRole", () => {
    it("should assign role to user", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await RBACManager.assignRole("user-123", "pro", "admin-1");

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("assign_role", {
        p_user_id: "user-123",
        p_role_name: "pro",
        p_granted_by: "admin-1",
      });
    });

    it("should return false for invalid role", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await RBACManager.assignRole(
        "user-123",
        "invalid-role"
      );

      expect(result).toBe(false);
    });
  });

  describe("removeRole", () => {
    it("should remove role from user", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await RBACManager.removeRole("user-123", "pro");

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("remove_role", {
        p_user_id: "user-123",
        p_role_name: "pro",
      });
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin user", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await RBACManager.isAdmin("admin-123");

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("user_has_permission", {
        p_user_id: "admin-123",
        p_permission_name: "admin.system.read",
      });
    });

    it("should return false for non-admin user", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await RBACManager.isAdmin("user-123");

      expect(result).toBe(false);
    });
  });
});
