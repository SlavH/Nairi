/**
 * Session Manager Tests (Phase 12)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionManager } from "@/lib/auth/session-manager";

// Mock Supabase client (chainable; terminal methods return Promises)
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  gt: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("SessionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("should create a new session", async () => {
      const mockData = { id: "session-123" };
      mockSupabase.single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const sessionId = await SessionManager.createSession(
        "user-123",
        "refresh-token",
        {
          deviceInfo: { os: "iOS" },
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
        }
      );

      expect(sessionId).toBe("session-123");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should use default expiration of 30 days", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: "session-123" },
        error: null,
      });

      await SessionManager.createSession("user-123", "refresh-token");

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      const expiresAt = new Date(insertCall.expires_at);
      const now = new Date();
      const daysDiff = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });

    it("should hash refresh token", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: "session-123" },
        error: null,
      });

      await SessionManager.createSession("user-123", "refresh-token-abc");

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.refresh_token_hash).toBeTruthy();
      expect(insertCall.refresh_token_hash).not.toBe("refresh-token-abc");
    });
  });

  describe("verifyAndRotateToken", () => {
    it("should verify and rotate token", async () => {
      const mockSession = {
        id: "session-123",
        user_id: "user-123",
        refresh_token_hash: "hashed-token",
        expires_at: new Date(Date.now() + 1000000).toISOString(),
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSession,
        error: null,
      });
      mockSupabase.gt.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockImplementation((col: string, val: string) =>
        col === "id" && val === "session-123"
          ? Promise.resolve({ data: null, error: null }) as unknown as typeof mockSupabase
          : mockSupabase
      );

      const result = await SessionManager.verifyAndRotateToken("old-token");

      expect(result).toBeTruthy();
      expect(result?.sessionId).toBe("session-123");
      expect(result?.newRefreshToken).toBeTruthy();
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should return null for invalid token", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await SessionManager.verifyAndRotateToken("invalid-token");

      expect(result).toBeNull();
    });

    it("should return null for expired token", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await SessionManager.verifyAndRotateToken("expired-token");

      expect(result).toBeNull();
    });
  });

  describe("revokeSession", () => {
    it("should revoke a session", async () => {
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(Promise.resolve({ data: null, error: null }));

      await SessionManager.revokeSession("session-123");

      expect(mockSupabase.update).toHaveBeenCalled();
      const updateCall = mockSupabase.update.mock.calls[0][0];
      expect(updateCall.is_revoked).toBe(true);
    });
  });

  describe("getUserSessions", () => {
    it("should retrieve user sessions", async () => {
      const mockSessions = [
        {
          id: "session-1",
          device_info: { os: "iOS" },
          expires_at: new Date().toISOString(),
        },
        {
          id: "session-2",
          device_info: { os: "Android" },
          expires_at: new Date().toISOString(),
        },
      ];

      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.gt.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(Promise.resolve({ data: mockSessions, error: null }));

      const sessions = await SessionManager.getUserSessions("user-123");

      expect(sessions).toHaveLength(2);
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
    });
  });
});
