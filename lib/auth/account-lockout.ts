/**
 * Account Lockout Manager (Phase 4)
 * Handles failed login attempts and account lockout
 */
import { createClient } from "@/lib/supabase/server";

export class AccountLockoutManager {
  /**
   * Check if account is locked
   */
  static async isAccountLocked(userId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("is_account_locked", {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || false;
  }

  /**
   * Record a failed login attempt
   */
  static async recordFailedLogin(
    email: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_failed_login", {
      p_email: email,
      p_ip_address: options?.ipAddress || null,
      p_user_agent: options?.userAgent || null,
    });

    if (error) throw error;
  }

  /**
   * Clear failed login attempts on successful login
   */
  static async clearFailedLogins(email: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("clear_failed_logins", {
      p_email: email,
    });

    if (error) throw error;
  }

  /**
   * Get failed login count for email
   */
  static async getFailedLoginCount(email: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("failed_login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gt("attempted_at", new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 minutes

    if (error) throw error;
    return count || 0;
  }
}
