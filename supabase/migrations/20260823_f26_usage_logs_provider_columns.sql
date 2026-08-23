-- F26 (docs/AUDIT_TRIAGE.md): lib/ai/provider-health.ts queried
-- usage_logs(provider, success) but those columns never existed, so every
-- health check errored and reported providers as "down".
-- Add the columns and backfill nothing: rows without provider/success are
-- treated as "unknown" by the monitor and skipped in error-rate math.

ALTER TABLE public.usage_logs
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS success BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_usage_logs_provider_created
  ON public.usage_logs(provider, created_at DESC);
