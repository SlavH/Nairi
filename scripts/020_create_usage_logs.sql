-- Usage logs for AI generation cost tracking (used by lib/cost-tracker and GET /api/usage)
-- Run after 019_create_tempmail_log.sql

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generation_type text NOT NULL CHECK (generation_type IN (
    'text', 'image', 'video', 'audio', 'code', 'simulation', 'document', 'presentation'
  )),
  cost numeric(12, 6) NOT NULL DEFAULT 0,
  model text,
  tokens integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_generation_type ON public.usage_logs(generation_type);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs_insert_own" ON public.usage_logs;
CREATE POLICY "usage_logs_select_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usage_logs_insert_own" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.usage_logs IS 'Tracks AI generation costs per user for usage stats and limits (see lib/cost-tracker).';
