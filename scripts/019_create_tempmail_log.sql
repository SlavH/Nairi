-- Tempmail usage log for long-term monitoring and abuse detection
-- Run after 018_create_execution_traces.sql

CREATE TABLE IF NOT EXISTS public.tempmail_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_domain text NOT NULL,
  action text NOT NULL CHECK (action IN ('signup', 'login')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tempmail_usage_log_domain ON public.tempmail_usage_log (email_domain);
CREATE INDEX IF NOT EXISTS idx_tempmail_usage_log_created_at ON public.tempmail_usage_log (created_at DESC);

ALTER TABLE public.tempmail_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage tempmail_usage_log" ON public.tempmail_usage_log;
CREATE POLICY "Service role can manage tempmail_usage_log"
  ON public.tempmail_usage_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.tempmail_usage_log IS 'Logs tempmail domain usage for abuse monitoring (signup/login).';
