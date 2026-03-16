/**
 * Validates API keys to ensure they are not placeholder values
 * Extracted from multiple API routes for reusability
 */

/**
 * Check if an API key is valid (not a placeholder)
 * @param key - The API key to validate
 * @returns true if the key is valid, false if it's a placeholder or undefined
 */
export function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false
  
  // Check for common placeholder patterns
  const placeholderPatterns = [
    /^your_/i,
    /^sk-your/i,
    /^placeholder/i,
    /^xxx/i,
    /^test_/i,
    /_here$/i,
    /^insert/i
  ]
  
  return !placeholderPatterns.some(pattern => pattern.test(key))
}

/**
 * Validate multiple API keys and return the first valid one
 * @param keys - Object with provider names as keys and API keys as values
 * @returns Object with the first valid provider and key, or null if none are valid
 */
export function getFirstValidApiKey(
  keys: Record<string, string | undefined>
): { provider: string; key: string } | null {
  for (const [provider, key] of Object.entries(keys)) {
    if (isValidApiKey(key)) {
      return { provider, key: key! }
    }
  }
  return null
}
