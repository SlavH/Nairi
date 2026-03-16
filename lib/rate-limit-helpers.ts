/**
 * Helper utilities for applying rate limits to API routes
 */

import { checkRateLimit, getClientIdentifier, type RateLimitConfig } from './rate-limit'

/**
 * Apply rate limit to a request and return error response if exceeded
 * Returns null if rate limit check passes
 */
export async function applyRateLimit(
  req: Request,
  config: RateLimitConfig,
  userId?: string
): Promise<Response | null> {
  const identifier = userId || getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, config)
  
  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': rateLimit.retryAfter!.toString()
        }
      }
    )
  }
  
  return null
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: Response,
  config: RateLimitConfig,
  remaining: number,
  resetTime: number
): Response {
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())
  
  return response
}

/**
 * Middleware-style rate limit wrapper
 */
export async function withRateLimit(
  req: Request,
  config: RateLimitConfig,
  handler: (req: Request) => Promise<Response>,
  userId?: string
): Promise<Response> {
  const identifier = userId || getClientIdentifier(req)
  const rateLimit = checkRateLimit(identifier, config)
  
  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': rateLimit.retryAfter!.toString()
        }
      }
    )
  }
  
  // Call handler
  const response = await handler(req)
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
  
  return response
}
