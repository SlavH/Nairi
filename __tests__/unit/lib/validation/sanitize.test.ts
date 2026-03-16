/**
 * Sanitization Tests (Phase 61)
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeSql,
  sanitizePath,
  sanitizeEmail,
  sanitizeUrl,
} from "@/lib/validation/sanitize";

describe("Sanitization Utilities", () => {
  describe("sanitizeHtml", () => {
    it("should strip HTML tags", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe("alert('xss')");
      expect(sanitizeHtml("<div>Hello</div>")).toBe("Hello");
    });
  });

  describe("sanitizeText", () => {
    it("should escape HTML entities", () => {
      expect(sanitizeText("<script>")).toBe("&lt;script&gt;");
      expect(sanitizeText('"quote"')).toBe("&quot;quote&quot;");
    });
  });

  describe("sanitizeSql", () => {
    it("should remove SQL comment markers", () => {
      expect(sanitizeSql("SELECT * -- comment")).toBe("SELECT *  comment");
      expect(sanitizeSql("SELECT * /* comment */")).toBe("SELECT *  comment ");
    });
  });

  describe("sanitizePath", () => {
    it("should prevent directory traversal", () => {
      expect(sanitizePath("../../../etc/passwd")).toBe("etcpasswd");
      expect(sanitizePath("/path/to/file")).toBe("pathtofile");
    });
  });

  describe("sanitizeEmail", () => {
    it("should normalize email", () => {
      expect(sanitizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
      expect(sanitizeEmail("test<script>@example.com")).toBe("test@example.com");
    });
  });

  describe("sanitizeUrl", () => {
    it("should validate URLs", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
      expect(sanitizeUrl("javascript:alert('xss')")).toBe("");
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
    });
  });
});
