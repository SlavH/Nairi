import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from "@/lib/supabase/session"
import { validateOrigin, MAX_REQUEST_SIZES } from './lib/security/request-validator'

/**
 * Proxy for Next.js 16+ (replaces middleware.ts)
 *
 * Implements:
 * - Supabase session management
 * - CSRF protection via origin validation
 * - Request size limits
 * - Security headers
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip security checks for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    return await updateSession(request)
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

      // Determine max size based on endpoint
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
  const response = await updateSession(request)

  // Add security headers
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
