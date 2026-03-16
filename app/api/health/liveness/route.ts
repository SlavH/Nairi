import { NextResponse } from 'next/server'

/**
 * Liveness Probe Endpoint
 * 
 * Simple check to verify the service is alive and responding.
 * Returns 200 if the process is running.
 */
export async function GET() {
  return NextResponse.json({ status: 'alive' }, { status: 200 });
}
