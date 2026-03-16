/**
 * Input Sanitization Utilities (Phase 7)
 * Sanitizes user input to prevent XSS, SQL injection, and other attacks
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Strips all HTML tags for safety - use markdown parser for rich text instead
 */
export function sanitizeHtml(html: string): string {
  // Remove all HTML tags
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize plain text by escaping HTML entities
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize SQL input by removing dangerous characters
 * Note: Always use parameterized queries - this is a secondary defense
 */
export function sanitizeSql(input: string): string {
  // Remove SQL comment markers
  return input
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .replace(/;/g, ""); // Remove statement terminators
}

/**
 * Sanitize file path to prevent directory traversal
 * Removes parent refs and path separators so paths cannot escape
 */
export function sanitizePath(path: string): string {
  return path
    .replace(/\.\./g, "")
    .replace(/\/+/g, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

/**
 * Sanitize email address (trim, lowercase, strip HTML tags and dangerous chars)
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[<>\"'`]/g, "");
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Remove null bytes and control characters
 */
export function removeControlChars(input: string): string {
  return input.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Truncate string to max length
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength - 3) + "...";
}
