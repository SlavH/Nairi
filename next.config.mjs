// Cache bust: 2026-02-05-v5-csp-integration
import { generateCSPHeader, generateDevCSPHeader } from './lib/security/csp.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript: enforce type safety in production builds (Phase 23)
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
  async headers() {
    // Use development CSP in dev mode, production CSP in production
    const csp = process.env.NODE_ENV === 'development'
      ? generateDevCSPHeader()
      : generateCSPHeader()

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
            key: 'Content-Security-Policy',
            value: csp
          },
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
}

export default nextConfig
