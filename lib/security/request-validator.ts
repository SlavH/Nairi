/**
 * Request Validation Utilities
 * 
 * Validates and sanitizes incoming requests to prevent attacks.
 */

import { NextRequest } from 'next/server'

/**
 * Maximum request body sizes (in bytes)
 */
export const MAX_REQUEST_SIZES = {
  chat: 100 * 1024, // 100KB for chat messages
  builder: 500 * 1024, // 500KB for code generation
  upload: 10 * 1024 * 1024, // 10MB for file uploads
  default: 1 * 1024 * 1024, // 1MB default
}

/**
 * Validate request body size
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSize: number
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = request.headers.get('content-length')
  
  if (!contentLength) {
    return { valid: false, error: 'Content-Length header required' }
  }

  const size = parseInt(contentLength, 10)
  
  if (isNaN(size)) {
    return { valid: false, error: 'Invalid Content-Length' }
  }

  if (size > maxSize) {
    return {
      valid: false,
      error: `Request too large. Maximum size: ${maxSize} bytes`,
    }
  }

  return { valid: true }
}

/**
 * Validate Content-Type header
 */
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  const contentType = request.headers.get('content-type')

  if (!contentType) {
    return { valid: false, error: 'Content-Type header required' }
  }

  const isAllowed = allowedTypes.some(type => 
    contentType.toLowerCase().includes(type.toLowerCase())
  )

  if (!isAllowed) {
    return {
      valid: false,
      error: `Invalid Content-Type. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  return sanitized
}

/**
 * Validate and sanitize JSON body
 */
export async function validateJSONBody<T>(
  request: NextRequest,
  schema?: (data: any) => T
): Promise<{ valid: boolean; data?: T; error?: string }> {
  try {
    const body = await request.json()

    if (schema) {
      const validated = schema(body)
      return { valid: true, data: validated }
    }

    return { valid: true, data: body as T }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    }
  }
}

/**
 * Check for suspicious patterns in input
 */
export function detectSuspiciousPatterns(input: string): {
  suspicious: boolean
  patterns: string[]
} {
  const suspiciousPatterns = [
    { name: 'SQL Injection', regex: /(union\s+select|insert\s+into|drop\s+table|alter\s+table|delete\s+from|update\s+\w+\s+set)\b/i },
    { name: 'XSS', regex: /<script[^>]*>[\s\S]*?<\/script>/i },
    { name: 'Path Traversal', regex: /\.\.[\\/]/g },
    { name: 'Command Injection', regex: /[`]|\$\(|;\s*(rm|cat|curl|wget|chmod|chown|sudo|bash|sh|nc|ncat)\b/gi },
  ]

  const detected: string[] = []

  for (const pattern of suspiciousPatterns) {
    if (pattern.regex.test(input)) {
      detected.push(pattern.name)
    }
  }

  return {
    suspicious: detected.length > 0,
    patterns: detected,
  }
}

/**
 * Validate origin header for CSRF protection
 */
export function validateOrigin(
  request: NextRequest,
  allowedOrigins: string[]
): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Allow requests without origin (same-origin or non-browser)
  if (!origin && !referer) {
    return { valid: true }
  }

  const requestOrigin = origin || new URL(referer!).origin

  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.includes('localhost')) {
      return requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')
    }
    return requestOrigin === allowed
  })

  if (!isAllowed) {
    return {
      valid: false,
      error: `Origin ${requestOrigin} not allowed`,
    }
  }

  return { valid: true }
}

/**
 * Resolve the set of origins allowed to make state-changing requests.
 * Combines an explicit allowlist (ALLOWED_ORIGINS, comma-separated) with the
 * Supabase project host (so the deployed app domain is always permitted).
 * Localhost/127.0.0.1 are always allowed for local development.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>()

  const configured = process.env.ALLOWED_ORIGINS
  if (configured) {
    configured.split(',').map(o => o.trim()).filter(Boolean).forEach(o => origins.add(o))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      origins.add(new URL(supabaseUrl).origin)
    } catch {
      // ignore malformed URL
    }
  }

  // Always permit local development
  origins.add('http://localhost:3000')
  origins.add('https://localhost:3000')
  origins.add('http://127.0.0.1:3000')
  origins.add('https://127.0.0.1:3000')

  return Array.from(origins)
}

/**
 * Convenience guard for mutating API routes (POST/PUT/PATCH/DELETE).
 * Returns a 403 Response when the Origin/Referer is not allowlisted.
 * Non-browser clients (no Origin/Referer header) are still permitted so that
 * server-to-server calls, webhooks, and tests are not broken.
 */
export function assertSameOrigin(request: NextRequest): Response | null {
  const result = validateOrigin(request, getAllowedOrigins())
  if (!result.valid) {
    return new Response(
      JSON.stringify({ error: 'Cross-origin request blocked', detail: result.error }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return null
}
