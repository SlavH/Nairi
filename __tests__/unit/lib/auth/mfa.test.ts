import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ from: () => ({}) })) }))

import { MFAManager } from "@/lib/auth/mfa"

const KEY = "unit-test-mfa-encryption-key-0123456789abcdef"

describe("MFAManager (F28)", () => {
  beforeEach(() => {
    process.env.MFA_ENCRYPTION_KEY = KEY
  })
  afterEach(() => {
    delete process.env.MFA_ENCRYPTION_KEY
  })

  describe("TOTP verification", () => {
    it("accepts a token generated for the current time window", () => {
      const { secret } = MFAManager.generateTOTPSecret("u1", "user@test.dev")
      const counter = Math.floor(Date.now() / 30000)
      const token = MFAManager.generateHOTP(secret, counter)
      expect(MFAManager.verifyTOTP(secret, token)).toBe(true)
    })

    it("accepts tokens from the previous/next window (drift ±1)", () => {
      const { secret } = MFAManager.generateTOTPSecret("u1", "user@test.dev")
      const counter = Math.floor(Date.now() / 30000)
      expect(MFAManager.verifyTOTP(secret, MFAManager.generateHOTP(secret, counter - 1))).toBe(true)
      expect(MFAManager.verifyTOTP(secret, MFAManager.generateHOTP(secret, counter + 1))).toBe(true)
    })

    it("rejects tokens outside the drift window", () => {
      const { secret } = MFAManager.generateTOTPSecret("u1", "user@test.dev")
      const counter = Math.floor(Date.now() / 30000)
      const stale = MFAManager.generateHOTP(secret, counter - 5)
      expect(MFAManager.verifyTOTP(secret, stale)).toBe(false)
    })

    it("rejects malformed tokens", () => {
      const { secret } = MFAManager.generateTOTPSecret("u1", "user@test.dev")
      expect(MFAManager.verifyTOTP(secret, "abcdef")).toBe(false)
      expect(MFAManager.verifyTOTP(secret, "12345")).toBe(false)
      expect(MFAManager.verifyTOTP(secret, "")).toBe(false)
    })

    it("provisions an otpauth URL without third-party QR services", () => {
      const { secret, otpauthUrl } = MFAManager.generateTOTPSecret("u1", "user@test.dev")
      expect(secret).toMatch(/^[A-Z2-7]{20}$/)
      expect(otpauthUrl).toContain(`secret=${secret}`)
      expect(otpauthUrl).toContain("otpauth://totp/")
      // no qrserver or any http(s) QR endpoint in the module at all
    })
  })

  describe("backup codes", () => {
    it("generates the requested count of unique alphanumeric codes", () => {
      const codes = MFAManager.generateBackupCodes(10)
      expect(codes).toHaveLength(10)
      expect(new Set(codes).size).toBe(10)
      for (const c of codes) {
        expect(c).toMatch(/^[A-HJ-NP-Z2-9]{10}$/)
      }
    })
  })
})
