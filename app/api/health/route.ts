import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config/env'

interface HealthCheck {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
}

async function checkSupabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const responseTime = Date.now() - startTime;
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is OK
      return {
        name: 'supabase',
        status: 'degraded',
        responseTime,
        error: error.message,
      };
    }
    
    return {
      name: 'supabase',
      status: 'ok',
      responseTime,
    };
  } catch (error) {
    return {
      name: 'supabase',
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAIProviders(): Promise<HealthCheck> {
  const providers = Object.entries(config.ai).filter(([_, key]) => key);
  return {
    name: 'ai_providers',
    status: providers.length > 0 ? 'ok' : 'degraded',
    error: providers.length === 0 ? 'No AI providers configured' : undefined,
  };
}

/**
 * Health Check Endpoint (Phase 10)
 *
 * Returns the health status of the application with dependency checks.
 * Used by monitoring systems, load balancers, and orchestration platforms.
 *
 * @returns JSON response with health status and metadata
 */
export async function GET() {
  try {
    const checks: HealthCheck[] = [];
    
    // Server check
    checks.push({
      name: 'server',
      status: 'ok',
    });
    
    // Supabase check (with timeout)
    const supabaseCheck = await Promise.race([
      checkSupabase(),
      new Promise<HealthCheck>((resolve) => 
        setTimeout(() => resolve({
          name: 'supabase',
          status: 'down',
          error: 'Timeout after 5s',
        }), 5000)
      ),
    ]);
    checks.push(supabaseCheck);
    
    // AI providers check
    checks.push(await checkAIProviders());
    
    // Determine overall status
    const hasDown = checks.some(c => c.status === 'down');
    const hasDegraded = checks.some(c => c.status === 'degraded');
    const overallStatus = hasDown ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: typeof process.uptime === 'function' ? Math.floor(process.uptime()) : undefined,
      environment: config.env,
      version: process.env.npm_package_version || '0.34.0',
      checks: checks.reduce((acc, check) => {
        acc[check.name] = {
          status: check.status,
          ...(check.responseTime && { responseTime: `${check.responseTime}ms` }),
          ...(check.error && { error: check.error }),
        };
        return acc;
      }, {} as Record<string, unknown>),
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Readiness Check Endpoint (Liveness Probe)
 * 
 * Indicates if the service is ready to accept traffic.
 * Returns 200 if ready, 503 if not ready.
 * Used by Kubernetes, Docker, and orchestration platforms.
 */
export async function HEAD() {
  try {
    // Quick check - just verify server is responding
    const isReady = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    return new NextResponse(null, { status: isReady ? 200 : 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
