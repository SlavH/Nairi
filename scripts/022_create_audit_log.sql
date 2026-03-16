-- Audit log for sensitive actions (Phase 35). No PII in log body; retention and access documented in ARCHITECTURE.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role or the owning user (for their own log) can read; only backend can insert.
DROP POLICY IF EXISTS "Users can read own audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Service role can manage audit log" ON public.audit_log;
CREATE POLICY "Users can read own audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage audit log"
  ON public.audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.audit_log IS 'Audit trail for login, password change, billing, data export, delete account. No PII in metadata.';
