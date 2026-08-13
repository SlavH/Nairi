import { NextResponse, NextRequest } from 'next/server'

import { updateSession } from "@/lib/supabase/session"

import { generateCSPHeader, generateNonce } from './lib/security/csp.mjs'
import { validateOrigin, MAX_REQUEST_SIZES } from './lib/security/request-validator'

/**
 * Middleware for Next.js 16+
 *
 * Implements:
 * - Production blocking of test/debug pages
 * - Edge rate limiting for API routes
 * - CSRF protection via origin validation
 * - Request size limits
 * - Supabase session management
 * - Security headers
 */

// Routes that must be BLOCKED in production (test/debug pages)
const blockedInProduction = [
  "/test-error",
  "/test-interface",
  "/admin/seed",
]

// Rate limit store (in-memory; use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) rateLimitStore.delete(key)
  }
}, 60_000)

const apiRateLimits: Record<string, { max: number; window: number }> = {
  "/api/chat": { max: 30, window: 60_000 },
  "/api/nairi/chat": { max: 30, window: 60_000 },
  "/api/generate": { max: 10, window: 60_000 },
  "/api/generate-image": { max: 5, window: 60_000 },
  "/api/generate-video": { max: 3, window: 60_000 },
  "/api/generate-3d": { max: 3, window: 60_000 },
  "/api/create": { max: 10, window: 60_000 },
  "/api/auth": { max: 5, window: 60_000 },
}

function checkRateLimit(identifier: string, max: number, window: number): boolean {
  const now = Date.now()
  const key = `${identifier}:${max}:${window}`
  let entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + window }
    rateLimitStore.set(key, entry)
    return true
  }
  entry.count++
  if (entry.count > max) return false
  return true
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip security checks for static files, Next.js internals, and Let's Encrypt validation
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/.well-known') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    return await updateSession(request)
  }

  // Block test/debug routes in production
  if (process.env.NODE_ENV === "production") {
    for (const blocked of blockedInProduction) {
      if (pathname === blocked || pathname.startsWith(`${blocked}/`)) {
        return new NextResponse("Not Found", { status: 404 })
      }
    }
  }

  // Edge rate limiting for API routes (before heavier checks)
  for (const [prefix, config] of Object.entries(apiRateLimits)) {
    if (pathname.startsWith(prefix)) {
      // Combine IP with a coarse user signal (Supabase auth cookie) so limits
      // are not purely IP-based (and thus spoofable via x-forwarded-for).
      const ip = getClientIp(request)
      const authCookie = request.cookies.get('sb-access-token')?.value
        || request.cookies.get('sb-auth-token')?.value
      const clientId = authCookie ? `${ip}:u` : ip
      if (!checkRateLimit(clientId, config.max, config.window)) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(config.window / 1000)) } }
        )
      }
      break
    }
  }

  // CSRF Protection: Validate origin for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const host = request.headers.get('host') || ''
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]

    const originValidation = validateOrigin(request, allowedOrigins)

    if (!originValidation.valid) {
      console.warn(`[Security] CSRF attempt blocked: ${originValidation.error}`)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Request Size Validation for API routes
  if (pathname.startsWith('/api/')) {
    const contentLength = request.headers.get('content-length')

    if (contentLength) {
      const size = parseInt(contentLength, 10)
      let maxSize = MAX_REQUEST_SIZES.default

      if (pathname.includes('/chat')) {
        maxSize = MAX_REQUEST_SIZES.chat
      } else if (pathname.includes('/builder')) {
        maxSize = MAX_REQUEST_SIZES.builder
      } else if (pathname.includes('/upload')) {
        maxSize = MAX_REQUEST_SIZES.upload
      }

      if (size > maxSize) {
        console.warn(`[Security] Request too large: ${size} bytes (max: ${maxSize})`)
        return new NextResponse(
          JSON.stringify({
            error: 'Payload too large',
            maxSize: maxSize,
            receivedSize: size
          }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }

  // Update Supabase session
  // Propagate a per-request CSP nonce to Next.js so its inline hydration
  // scripts/styles are nonced instead of blocked (this is what makes client
  // components mount instead of hanging on loading spinners).
  const nonce = generateNonce()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  const nonceRequest = new NextRequest(request.url, { headers: requestHeaders })
  const response = await updateSession(nonceRequest)

  // Add security headers
  const isDev = process.env.NODE_ENV !== 'production'
  response.headers.set('Content-Security-Policy', generateCSPHeader(nonce, { dev: isDev }))
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
