// Cache bust: 2026-08-13-csp-nonce-middleware
/** @type {import('next').NextConfig} */

// `standalone` output is for self-hosted Docker images only (see Dockerfile).
// On Vercel it must stay off: building standalone there breaks the
// output-file-tracing finalization step (ENOENT .next/next-server.js.nft.json).
const nextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,

  // TypeScript: type errors fail the build (F43). `tsc --noEmit` is clean;
  // hiding build-time type errors let real bugs reach production.
  typescript: {
    ignoreBuildErrors: false,
  },
  

  
  // PERFORMANCE FIX: Enable image optimization
  // Next.js Image Optimization provides automatic image optimization
  images: {
    unoptimized: false, // Changed from true - Enable optimization for production
    // Configure allowed domains for external images
    // SECURITY FIX: Restrict to specific trusted domains instead of wildcard
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.openai.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Add more trusted domains as needed
    ],
    // Image formats to support
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Additional recommended security headers
  // NOTE: Content-Security-Policy is intentionally NOT set here. A static header
  // cannot carry a per-request nonce, and a second CSP header would be
  // intersected by browsers, blocking Next.js inline hydration scripts. The
  // nonce-based CSP is applied in proxy.ts (middleware).
  async headers() {
    return [
      // Cache public assets (Phase 32)
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ]
  },
  
  // Recommended: Enable React strict mode for better error detection
  reactStrictMode: true,

  // Legacy top-level routes consolidated into /dashboard/* equivalents
  async redirects() {
    return [
      { source: "/billing", destination: "/dashboard/billing", permanent: true },
      { source: "/credits", destination: "/dashboard/credits", permanent: true },
      { source: "/activity", destination: "/dashboard/activity", permanent: true },
      { source: "/execution-traces", destination: "/dashboard/traces", permanent: true },
      { source: "/notifications", destination: "/dashboard/notifications", permanent: true },
    ]
  },
}

export default nextConfig
