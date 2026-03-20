/**
 * Content Security Policy (CSP) Configuration
 * 
 * This file generates CSP headers to protect against XSS, clickjacking,
 * and other code injection attacks.
 * 
 * @module csp
 */

/**
 * Generate production CSP header
 * Strict policy for production environment
 */
export function generateCSPHeader() {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://js.hcaptcha.com https://js.stripe.com", // Next.js, Vercel Analytics, HCaptcha, Stripe
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-components/Tailwind
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
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://js.hcaptcha.com https://js.stripe.com",
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

/**
 * Generate CSP nonce for inline scripts
 * Use this for inline scripts that need to be allowed
 */
export function generateNonce() {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}
