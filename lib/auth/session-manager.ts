/**
 * Session Manager (Phase 4)
 * Handles session management, refresh token rotation, and session timeout
 */
import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  lastUsedAt: Date;
}

export class SessionManager {
  /**
   * Create a new session with refresh token
   */
  static async createSession(
    userId: string,
    refreshToken: string,
    options?: {
      deviceInfo?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      expiresInDays?: number;
    }
  ): Promise<string> {
    const supabase = await createClient();
    const expiresInDays = options?.expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const refreshTokenHash = this.hashToken(refreshToken);

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        refresh_token: refreshToken,
        refresh_token_hash: refreshTokenHash,
        device_info: options?.deviceInfo,
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Verify and rotate refresh token
   */
  static async verifyAndRotateToken(
    oldRefreshToken: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ newRefreshToken: string; sessionId: string } | null> {
    const supabase = await createClient();
    const tokenHash = this.hashToken(oldRefreshToken);

    // Find session by token hash
    const { data: session, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("refresh_token_hash", tokenHash)
      .eq("is_revoked", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) return null;

    // Generate new refresh token
    const newRefreshToken = this.generateRefreshToken();
    const newTokenHash = this.hashToken(newRefreshToken);

    // Update session with new token (token rotation)
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        refresh_token: newRefreshToken,
        refresh_token_hash: newTokenHash,
        last_used_at: new Date().toISOString(),
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
      })
      .eq("id", session.id);

    if (updateError) throw updateError;

    return {
      newRefreshToken,
      sessionId: session.id,
    };
  }

  /**
   * Revoke a session
   */
  static async revokeSession(sessionId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sessions")
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) throw error;
  }

  /**
   * Revoke all sessions for a user
   */
  static async revokeAllUserSessions(userId: string): Promise<number> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("revoke_all_sessions", {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Get active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_revoked", false)
      .gt("expires_at", new Date().toISOString())
      .order("last_used_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      deviceInfo: s.device_info,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      expiresAt: new Date(s.expires_at),
      lastUsedAt: new Date(s.last_used_at),
    }));
  }

  /**
   * Generate a secure refresh token
   */
  private static generateRefreshToken(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Hash a token for storage
   */
  private static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
