/**
 * Simple in-memory cache for API responses (Phase 111)
 * Use for frequently requested data with short TTL.
 * For production with multiple instances, use Redis.
 */

const cache = new Map<string, { value: unknown; expiresAt: number }>();

const DEFAULT_TTL_MS = 60 * 1000; // 1 minute

export function get<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function set(key: string, value: unknown, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidate(key: string): void {
  cache.delete(key);
}

export function invalidatePattern(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
