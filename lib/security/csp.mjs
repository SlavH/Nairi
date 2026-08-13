/**
 * Content Security Policy (CSP) Configuration
 * 
 * This file generates CSP headers to protect against XSS, clickjacking,
 * and other code injection attacks.
 * 
 * @module csp
 */

// Store for nonces (in production, use a proper store like Redis)
const nonceStore = new Map()

/**
 * Generate a CSP nonce and store it for validation
 */
export function generateNonce() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  nonceStore.set(nonce, Date.now())
  // Clean old nonces (older than 1 hour)
  const now = Date.now()
  for (const [key, timestamp] of nonceStore.entries()) {
    if (now - timestamp > 3600000) {
      nonceStore.delete(key)
    }
  }
  return nonce
}

/**
 * Validate a nonce (for server-side verification if needed)
 */
export function validateNonce(nonce) {
  return nonceStore.has(nonce)
}

/**
 * Generate production CSP header
 * Strict policy for production environment - no unsafe-inline for scripts.
 * Next.js inline hydration scripts/styles are allowed via a per-request nonce
 * (propagated through the `x-nonce` request header from middleware). Inline
 * styles must remain allowed because React renders style attributes that a CSP
 * nonce cannot cover.
 */
export function generateCSPHeader(nonce, options = {}) {
  const nonceDirective = nonce ? `'nonce-${nonce}'` : ''
  const evalDirective = options.dev ? "'unsafe-eval' " : ''
  // next-themes injects a deterministic inline theme script (no nonce support).
  // Its content differs between dev and prod bundles; allow both hashes. If the
  // next-themes version or ThemeProvider props change, re-derive via:
  //   curl -s localhost:3000/ | extract the inline script | openssl dgst -sha256 -binary | base64
  const themesHash =
    "'sha256-E8EPi3ovz+EfxEviTr9UjHKYh5PnfxNoZOnJbyuXKOo=' 'sha256-zjP2BXYgSCCnXNMXI2IL1yRydoQdsGR/uCCr6kyKsD0=' "

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' ${evalDirective}${nonceDirective} ${themesHash}'wasm-unsafe-eval' https://va.vercel-scripts.com https://js.hcaptcha.com https://js.stripe.com`, // Next.js, Vercel Analytics, HCaptcha, Stripe, WASM
    "style-src 'self' 'unsafe-inline'", // Required for React inline style attributes and Next.js critical CSS
    "img-src 'self' data: blob: https:", // Allow images from HTTPS sources
    "font-src 'self' data:",
    "connect-src 'self' blob: https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.groq.com https://api.cohere.ai https://api.mistral.ai https://api.perplexity.ai https://openrouter.ai https://api.replicate.com https://api.together.xyz https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://hcaptcha.com https://*.hcaptcha.com https://api.stripe.com", // AI providers, Supabase, Vercel Analytics, HCaptcha, Stripe
    "frame-src 'self' blob: https://*.codesandbox.io https://*.sandpack.codesandbox.io https://*.hcaptcha.com https://hcaptcha.com https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "child-src 'self' blob: https://*.codesandbox.io",
  ]

  return cspDirectives.join('; ')
}

/**
 * Generate development CSP header
 * More permissive policy for development with hot reload
 */
export function generateDevCSPHeader() {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https://va.vercel-scripts.com https://js.hcaptcha.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' ws://localhost:* http://localhost:* blob: https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.groq.com https://api.cohere.ai https://api.mistral.ai https://api.perplexity.ai https://openrouter.ai https://api.replicate.com https://api.together.xyz https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://hcaptcha.com https://*.hcaptcha.com https://api.stripe.com",
    "frame-src 'self' blob: https://*.codesandbox.io https://*.sandpack.codesandbox.io https://*.hcaptcha.com https://hcaptcha.com https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "child-src 'self' blob: https://*.codesandbox.io",
  ]

  return cspDirectives.join('; ')
}