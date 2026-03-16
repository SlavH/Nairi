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
 * Check rate limit using Redis (when REDIS_URL is set). Returns null if Redis unavailable.
 */
export async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  const redis = await getRedis()
  if (!redis) return null

  const now = Date.now()
  const key = `ratelimit:${identifier}`
  const windowSec = Math.ceil(config.windowMs / 1000)

  try {
    const multi = redis.multi()
    multi.incr(key)
    multi.pttl(key)
    const results = await multi.exec()
    if (!results) return null

    const incrResult = results[0]
    const ttlResult = results[1]
    if (incrResult[0] || ttlResult[0]) return null // Redis error

    const count = incrResult[1] as number
    let ttlMs = ttlResult[1] as number

    if (ttlMs <= 0) {
      await redis.pexpire(key, config.windowMs)
      ttlMs = config.windowMs
    }

    const resetTime = now + ttlMs

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
