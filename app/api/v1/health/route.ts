/**
 * API v1 Health Check Endpoint
 * 
 * This is the versioned health check endpoint.
 * Redirects to the main health endpoint for now.
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
    message: 'API v1 is operational',
    checks: {
      server: 'ok',
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      colab: !!process.env.BITNET_BASE_URL,
    },
  })
}
