/**
 * Redis-backed rate limiter. Used when REDIS_URL is set so limits apply across instances.
 * Requires optional dependency: npm install ioredis
 * When REDIS_URL is not set, lib/rate-limit.ts uses in-memory store only.
 */

import type { RateLimitConfig, RateLimitResult } from './rate-limit'

const REDIS_URL = process.env.REDIS_URL

let redisClient: import('ioredis').default | null = null

async function getRedis(): Promise<import('ioredis').default | null> {
  if (!REDIS_URL) return null
  if (redisClient) return redisClient
  try {
    const Redis = (await import('ioredis')).default
    redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 })
    return redisClient
  } catch {
    return null
  }
}

/**
 * Redis-backed rate limiter using atomic Lua script.
 */

const LUA_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {current, ttl}
`

export async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  const redis = await getRedis()
  if (!redis) return null

  const key = `ratelimit:${identifier}`

  try {
    // Run the rate-limit Lua script atomically via ioredis' generic `call`.
    // (ioredis does not ship typed `eval`/`evalsha` overloads, so we cast.)
    const call = (redis as unknown as { call: (...args: string[]) => Promise<[number, number]> }).call.bind(redis)

    const result = await call(
      "EVAL",
      LUA_SCRIPT,
      "1",
      key,
      config.windowMs.toString()
    )

    const [count, ttlMs] = result
    const resetTime = Date.now() + ttlMs

    if (count > config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(ttlMs / 1000),
      }
    }

    return {
      success: true,
      remaining: config.maxRequests - count,
      resetTime,
    }
  } catch {
    return null
  }
}
