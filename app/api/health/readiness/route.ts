import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Readiness Probe Endpoint
 * 
 * More thorough readiness check that verifies critical dependencies.
 * Returns 200 only if all critical services are available.
 */
export async function GET() {
  try {
    // Check Supabase connection
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { status: 'not_ready', reason: 'database_unavailable' },
        { status: 503 }
      );
    }
    
    return NextResponse.json({ status: 'ready' }, { status: 200 });
  } catch {
    return NextResponse.json(
      { status: 'not_ready', reason: 'service_error' },
      { status: 503 }
    );
  }
}
