-- Phase 6: Rate Limit Monitoring Table
-- Tracks rate limit events for analytics

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  identifier TEXT NOT NULL, -- User ID, IP, etc.
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_endpoint ON public.rate_limit_events(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_identifier ON public.rate_limit_events(identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_blocked ON public.rate_limit_events(blocked, created_at DESC) WHERE blocked = true;

-- Cleanup old events (older than 30 days)
DROP FUNCTION IF EXISTS public.cleanup_rate_limit_events();
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limit_events
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Schedule cleanup (requires pg_cron)
DO $do$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-rate-limit-events',
      '0 2 * * *', -- Daily at 2 AM
      $$SELECT public.cleanup_rate_limit_events()$$
    );
  END IF;
END $do$;

COMMENT ON TABLE public.rate_limit_events IS 'Rate limit event tracking for monitoring and analytics';
