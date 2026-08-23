-- F27 (docs/AUDIT_TRIAGE.md): signup_attempts PII leak + broken contact form.
--
-- 1. signup_attempts exposed email/IP of every signup attempt to ANY
--    authenticated user via "signup_attempts_service_read"
--    USING (auth.uid() IS NOT NULL). Drop it: service_role bypasses RLS and
--    retains full access for administration.
--
-- 2. contact_submissions became write-dead for anonymous visitors when the
--    public INSERT policy was dropped (20260804 hardening) and 045 required
--    auth. Provide an explicit SECURITY DEFINER RPC so anon users can submit
--    a ticket while still having zero direct table access.

DROP POLICY IF EXISTS "signup_attempts_service_read" ON public.signup_attempts;

DROP POLICY IF EXISTS "contact_submissions_insert" ON public.contact_submissions;
CREATE POLICY "contact_submissions_insert" ON public.contact_submissions
  FOR INSERT WITH CHECK (false); -- direct writes stay denied; RPC only

DROP FUNCTION IF EXISTS public.submit_contact_submission(TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.submit_contact_submission(
  p_name TEXT,
  p_email TEXT,
  p_reason TEXT,
  p_subject TEXT,
  p_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_name IS NULL OR length(btrim(p_name)) = 0 OR length(p_name) > 100 THEN
    RAISE EXCEPTION 'invalid_field: name';
  END IF;
  IF p_email IS NULL OR p_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid_field: email';
  END IF;
  IF p_subject IS NULL OR length(btrim(p_subject)) = 0 OR length(p_subject) > 200 THEN
    RAISE EXCEPTION 'invalid_field: subject';
  END IF;
  IF p_message IS NULL OR length(btrim(p_message)) = 0 OR length(p_message) > 5000 THEN
    RAISE EXCEPTION 'invalid_field: message';
  END IF;

  INSERT INTO public.contact_submissions (
    user_id, name, email, reason, subject, message, status
  ) VALUES (
    auth.uid(),
    btrim(p_name),
    btrim(lower(p_email)),
    COALESCE(NULLIF(btrim(p_reason), ''), 'general'),
    btrim(p_subject),
    btrim(p_message),
    'new'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_submission FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_submission TO anon, authenticated;
