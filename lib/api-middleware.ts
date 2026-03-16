import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ZodSchema } from 'zod'
import { checkRateLimit, getClientIdentifier, RateLimitConfig } from './rate-limit'
import { getBypassUserId, isBypassAuthEnabled } from './auth'

/**
 * Validate request body against a Zod schema
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validated = schema.parse(body)
      return { success: true, data: validated }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      }
    }
  }
}

/**
 * Apply rate limiting to an API route
 */
export function withRateLimit(config: RateLimitConfig) {
  return (req: NextRequest) => {
    const identifier = getClientIdentifier(req)
    const result = checkRateLimit(identifier, config)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      )
    }

    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      },
    }
  }
}

/**
 * Require authentication for an API route.
 * Supports:
 * - Bearer token: validates JWT with Supabase Auth.
 * - Dev bypass: when BYPASS_AUTH=true, missing/invalid token still returns success with bypass user id.
 *
 * Usage: Call from API routes that need Bearer-based auth (e.g. mobile/external clients).
 * For cookie-based session auth, use createClient() from @/lib/supabase/server and getUserIdOrBypassForApi() from @/lib/auth instead.
 */
export async function requireAuth(req: NextRequest): Promise<
  | { success: true; token: string; userId: string }
  | NextResponse
> {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isBypassAuthEnabled()) {
      return { success: true, token: '', userId: getBypassUserId() }
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  if (!token) {
    if (isBypassAuthEnabled()) {
      return { success: true, token: '', userId: getBypassUserId() }
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    if (isBypassAuthEnabled()) {
      return { success: true, token, userId: getBypassUserId() }
    }
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    if (isBypassAuthEnabled()) {
      return { success: true, token, userId: getBypassUserId() }
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return { success: true, token, userId: user.id }
}

/**
 * Error handler wrapper
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      
      // Never expose internal error details to client in production
      const isDev = process.env.NODE_ENV === 'development'
      return NextResponse.json(
        {
          error: 'Internal server error',
          ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' }),
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(req: NextRequest) => any>) {
  return async (req: NextRequest) => {
    for (const middleware of middlewares) {
      const result = await middleware(req)
      if (result instanceof NextResponse) {
        return result
      }
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status || 400 }
        )
      }
    }
    return { success: true }
  }
}
