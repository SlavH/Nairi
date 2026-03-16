/**
 * Simple in-memory rate limiter for API routes
 * For production, use Redis or a distributed rate limiter
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  maxRequests: number  // Maximum requests allowed
  windowMs: number     // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 * Uses in-memory store. For production with multiple instances, use checkRateLimitAsync and set REDIS_URL.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  
  let entry = rateLimitStore.get(key)
  
  // If no entry or expired, create new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, entry)
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    }
  }
  
  // Increment count
  entry.count++
  
  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Get client identifier from request (IP address or forwarded IP)
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback to a hash of user-agent + some request info
  const userAgent = req.headers.get('user-agent') || 'unknown'
  return `ua-${hashString(userAgent)}`
}

/**
 * Async rate limit check: uses Redis when REDIS_URL is set, otherwise in-memory.
 * Use this in production so limits apply across instances. Requires ioredis when REDIS_URL is set.
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (process.env.REDIS_URL) {
    try {
      const { checkRateLimitRedis } = await import('./rate-limit-redis')
      const result = await checkRateLimitRedis(identifier, config)
      if (result) return result
    } catch {
      // Fall through to in-memory
    }
  }
  return checkRateLimit(identifier, config)
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Chat API: 30 requests per minute
  chat: {
    maxRequests: 30,
    windowMs: 60 * 1000
  },
  // Code generation: 10 requests per minute
  generate: {
    maxRequests: 10,
    windowMs: 60 * 1000
  },
  // Image generation: 5 requests per minute
  image: {
    maxRequests: 5,
    windowMs: 60 * 1000
  },
  // Video generation: 3 requests per minute
  video: {
    maxRequests: 3,
    windowMs: 60 * 1000
  },
  // Auth endpoints: 5 requests per minute
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000
  }
}
