/**
 * Safety and content filters: pre/post model content filters; configurable per product.
 */

const BLOCK_PATTERNS = [
  /\b(api[_-]?key|secret|password)\s*[:=]\s*[\w-]+/gi,
  /<\s*script\s*>[\s\S]*?<\s*\/\s*script\s*>/gi,
]

export function filterInput(text: string, _product?: "chat" | "marketplace"): { allowed: boolean; reason?: string } {
  for (const p of BLOCK_PATTERNS) {
    if (p.test(text)) return { allowed: false, reason: "Blocked pattern detected" }
  }
  return { allowed: true }
}

export function filterOutput(text: string, _product?: "chat" | "marketplace"): string {
  return text.replace(/\b(api[_-]?key|secret|password)\s*[:=]\s*[\w-]+/gi, "[REDACTED]")
}
