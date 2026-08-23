/**
 * Multi-Factor Authentication Manager (Phase 4)
 * Handles TOTP, SMS, and Email MFA
 *
 * F28 notes (docs/AUDIT_TRIAGE.md):
 * - The TOTP secret is stored encrypted (AES-256-GCM), not hashed: TOTP
 *   verification needs the original secret, so a one-way hash made every
 *   verification fail forever. Hashing remains correct for backup codes.
 * - QR codes are no longer generated through api.qrserver.com, which leaked
 *   the otpauth secret to a third party. Callers get the otpauth:// URL and
 *   can render the QR locally (or offer manual entry).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, createHmac } from "crypto";

import { createClient } from "@/lib/supabase/server";

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
    // Rejection sampling to avoid modulo bias.
    let byte = bytes[i];
    while (byte >= 256 - (256 % chars.length)) {
      byte = randomBytes(1)[0];
    }
    secret += chars[byte % chars.length];
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

/**
 * AES-256-GCM key derived from MFA_ENCRYPTION_KEY. Required to enable TOTP:
 * without it the secret could only be stored plaintext or unrecoverably
 * hashed, and both options are unacceptable.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env.MFA_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error(
      "MFA_ENCRYPTION_KEY must be set (>= 32 chars) before enabling TOTP MFA."
    );
  }
  return createHash("sha256").update(raw).digest();
}

function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), enc.toString("base64"), tag.toString("base64")].join(":");
}

function decryptSecret(payload: string): string | null {
  try {
    const [ivB64, dataB64, tagB64] = payload.split(":");
    if (!ivB64 || !dataB64 || !tagB64) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

export class MFAManager {
  /**
   * Generate TOTP secret and its otpauth:// provisioning URL.
   * Render the QR code client-side from this URL; never send the secret to a
   * third-party QR service.
   */
  static generateTOTPSecret(userId: string, email: string): {
    secret: string;
    otpauthUrl: string;
  } {
    void userId;
    const secret = generateBase32Secret();
    const serviceName = "Nairi";
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}&digits=6&period=30`;

    return { secret, otpauthUrl };
  }

  /**
   * Verify TOTP code
   */
  static verifyTOTP(secret: string, token: string): boolean {
    try {
      if (!/^\d{6}$/.test(token)) return false;
      const time = Math.floor(Date.now() / 30000);
      for (let i = -1; i <= 1; i++) {
        const expectedToken = MFAManager.generateHOTP(secret, time + i);
        if (expectedToken === token) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /** Internal: RFC4226 HOTP derivation, exposed for tests. */
  static generateHOTP(secret: string, counter: number): string {
    const counterBytes = Buffer.alloc(8);
    counterBytes.writeBigInt64BE(BigInt(counter), 0);
    const secretHex = base32ToHex(secret);
    const key = Buffer.from(secretHex, "hex");
    const hmac = createHmac("sha1", key);
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

    // Encrypt the TOTP secret (reversible, unlike the previous sha256 which
    // made verification impossible). Throws if MFA_ENCRYPTION_KEY is absent.
    const encryptedSecret = secret ? encryptSecret(secret) : null;

    // Backup codes are one-use challenges: hashing is correct here.
    const hashedBackupCodes = options?.backupCodes?.map((code) =>
      MFAManager.hashBackupCode(code)
    );

    const { error } = await supabase.from("mfa_settings").upsert({
      user_id: userId,
      method,
      secret: encryptedSecret,
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
      const secret = decryptSecret(data.secret);
      if (!secret) return false;
      return MFAManager.verifyTOTP(secret, code);
    }

    if (method !== "totp" && Array.isArray(data.backup_codes) && data.backup_codes.length > 0) {
      const hashed = MFAManager.hashBackupCode(code);
      return data.backup_codes.includes(hashed);
    }

    // SMS and Email verification would be handled separately
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
   * Generate backup codes (cryptographically random)
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    while (codes.length < count) {
      const bytes = randomBytes(10);
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 10; i++) {
        code += alphabet[bytes[i] % alphabet.length];
      }
      if (!codes.includes(code)) codes.push(code);
    }
    return codes;
  }

  /**
   * Hash a backup code for storage
   */
  private static hashBackupCode(code: string): string {
    return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
  }
}
