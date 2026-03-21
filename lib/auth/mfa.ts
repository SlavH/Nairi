/**
 * Multi-Factor Authentication Manager (Phase 4)
 * Handles TOTP, SMS, and Email MFA
 */
import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";

export type MFAMethod = "totp" | "sms" | "email";

export interface MFASettings {
  id: string;
  userId: string;
  method: MFAMethod;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function generateBase32Secret(length: number = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += chars[bytes[i] % chars.length];
  }
  return secret;
}

function base32ToHex(base32: string): string {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let hex = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of base32.toUpperCase()) {
    const value = base32Chars.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      hex += ((buffer >> (bitsLeft - 8)) & 0xff).toString(16).padStart(2, "0");
      bitsLeft -= 8;
    }
  }
  return hex;
}

export class MFAManager {
  /**
   * Generate TOTP secret and QR code URL
   */
  static generateTOTPSecret(userId: string, email: string): {
    secret: string;
    qrCodeUrl: string;
  } {
    const secret = generateBase32Secret();
    const serviceName = "Nairi";
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}&digits=6&period=30`;

    return {
      secret,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`,
    };
  }

  /**
   * Verify TOTP code
   */
  static verifyTOTP(secret: string, token: string): boolean {
    try {
      if (!/^\d{6}$/.test(token)) return false;
      const time = Math.floor(Date.now() / 30000);
      for (let i = -1; i <= 1; i++) {
        const expectedToken = this.generateHOTP(secret, time + i);
        if (expectedToken === token) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private static generateHOTP(secret: string, counter: number): string {
    const counterBytes = Buffer.alloc(8);
    counterBytes.writeBigInt64BE(BigInt(counter), 0);
    const secretHex = base32ToHex(secret);
    const key = Buffer.from(secretHex, "hex");
    const hmac = require("crypto").createHmac("sha1", key);
    hmac.update(counterBytes);
    const hmacResult = hmac.digest();
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);
    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
  }

  /**
   * Enable MFA for a user
   */
  static async enableMFA(
    userId: string,
    method: MFAMethod,
    secret?: string,
    options?: {
      phoneNumber?: string;
      email?: string;
      backupCodes?: string[];
    }
  ): Promise<void> {
    const supabase = await createClient();

    // Hash secret if provided
    const hashedSecret = secret ? this.hashSecret(secret) : null;

    // Hash backup codes
    const hashedBackupCodes = options?.backupCodes?.map((code) =>
      this.hashSecret(code)
    );

    const { error } = await supabase.from("mfa_settings").upsert({
      user_id: userId,
      method,
      secret: hashedSecret,
      phone_number: options?.phoneNumber,
      email: options?.email,
      is_enabled: true,
      backup_codes: hashedBackupCodes,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  /**
   * Disable MFA for a user
   */
  static async disableMFA(userId: string, method: MFAMethod): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("mfa_settings")
      .update({
        is_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("method", method);

    if (error) throw error;
  }

  /**
   * Get MFA settings for a user
   */
  static async getMFASettings(userId: string): Promise<MFASettings[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mfa_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("is_enabled", true);

    if (error) throw error;

    return (data || []).map((m) => ({
      id: m.id,
      userId: m.user_id,
      method: m.method,
      isEnabled: m.is_enabled,
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }));
  }

  /**
   * Verify MFA code
   */
  static async verifyMFA(
    userId: string,
    method: MFAMethod,
    code: string
  ): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mfa_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("method", method)
      .eq("is_enabled", true)
      .single();

    if (error || !data) return false;

    if (method === "totp" && data.secret) {
      return this.verifyTOTP(data.secret, code);
    }

    // SMS and Email verification would be handled separately
    // This is a placeholder
    return false;
  }

  /**
   * Record MFA verification
   */
  static async recordVerification(
    userId: string,
    sessionId: string,
    method: MFAMethod,
    success: boolean,
    options?: {
      ipAddress?: string;
    }
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("mfa_verifications").insert({
      user_id: userId,
      session_id: sessionId,
      method,
      success,
      ip_address: options?.ipAddress,
    });

    if (error) throw error;
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(
        Math.random().toString(36).substring(2, 10).toUpperCase() +
          Math.random().toString(36).substring(2, 10).toUpperCase()
      );
    }
    return codes;
  }

  /**
   * Hash a secret for storage
   */
  private static hashSecret(secret: string): string {
    return createHash("sha256").update(secret).digest("hex");
  }
}
