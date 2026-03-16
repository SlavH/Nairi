-- Phase 4: Authentication System Hardening
-- Implements refresh token rotation, session timeout, account lockout, and 2FA support

-- Session management table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT NOT NULL, -- Hashed version for verification
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token_hash ON public.sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON public.sessions(is_revoked) WHERE is_revoked = false;

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON public.failed_login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON public.failed_login_attempts(ip_address, attempted_at DESC);

-- Account lockout tracking
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON public.account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON public.account_lockouts(locked_until);

-- 2FA/MFA settings
CREATE TABLE IF NOT EXISTS public.mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('totp', 'sms', 'email')),
  secret TEXT, -- Encrypted secret for TOTP
  phone_number TEXT, -- For SMS
  email TEXT, -- For email
  is_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[], -- Hashed backup codes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, method)
);

CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON public.mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_enabled ON public.mfa_settings(user_id, is_enabled) WHERE is_enabled = true;

-- MFA verification attempts
CREATE TABLE IF NOT EXISTS public.mfa_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  success BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_mfa_verifications_user_id ON public.mfa_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verifications_session_id ON public.mfa_verifications(session_id);

-- Function to check if account is locked
DROP FUNCTION IF EXISTS public.is_account_locked(UUID);
CREATE OR REPLACE FUNCTION public.is_account_locked(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_until TIMESTAMPTZ;
BEGIN
  SELECT locked_until INTO v_locked_until
  FROM public.account_lockouts
  WHERE user_id = p_user_id;
  
  IF v_locked_until IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF v_locked_until > NOW() THEN
    RETURN TRUE;
  ELSE
    -- Lockout expired, remove it
    DELETE FROM public.account_lockouts WHERE user_id = p_user_id;
    RETURN FALSE;
  END IF;
END;
$$;

-- Function to record failed login attempt
DROP FUNCTION IF EXISTS public.record_failed_login(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_count INTEGER;
  v_user_id UUID;
BEGIN
  -- Record the attempt
  INSERT INTO public.failed_login_attempts (email, ip_address, user_agent)
  VALUES (p_email, p_ip_address, p_user_agent);
  
  -- Count recent failures (last 15 minutes)
  SELECT COUNT(*) INTO v_failed_count
  FROM public.failed_login_attempts
  WHERE email = p_email
    AND attempted_at > NOW() - INTERVAL '15 minutes';
  
  -- Lock account after 5 failed attempts
  IF v_failed_count >= 5 THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.account_lockouts (user_id, locked_until, reason)
      VALUES (v_user_id, NOW() + INTERVAL '30 minutes', 'Too many failed login attempts')
      ON CONFLICT (user_id) DO UPDATE SET
        locked_until = NOW() + INTERVAL '30 minutes',
        reason = 'Too many failed login attempts';
    END IF;
  END IF;
END;
$$;

-- Function to clear failed login attempts on successful login
DROP FUNCTION IF EXISTS public.clear_failed_logins(TEXT);
CREATE OR REPLACE FUNCTION public.clear_failed_logins(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.failed_login_attempts
  WHERE email = p_email;
  
  -- Also remove lockout if exists
  DELETE FROM public.account_lockouts
  WHERE user_id IN (SELECT id FROM auth.users WHERE email = p_email);
END;
$$;

-- Function to revoke all sessions for a user
DROP FUNCTION IF EXISTS public.revoke_all_sessions(UUID);
CREATE OR REPLACE FUNCTION public.revoke_all_sessions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revoked_count INTEGER;
BEGIN
  UPDATE public.sessions
  SET is_revoked = TRUE, revoked_at = NOW()
  WHERE user_id = p_user_id AND is_revoked = FALSE;
  
  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  RETURN v_revoked_count;
END;
$$;

-- Function to clean up expired sessions
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions();
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.sessions
  WHERE expires_at < NOW() OR (is_revoked = TRUE AND revoked_at < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "sessions_select_own" ON public.sessions;
DROP POLICY IF EXISTS "mfa_settings_select_own" ON public.mfa_settings;
DROP POLICY IF EXISTS "mfa_settings_insert_own" ON public.mfa_settings;
DROP POLICY IF EXISTS "mfa_settings_update_own" ON public.mfa_settings;
CREATE POLICY "sessions_select_own" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mfa_settings_select_own" ON public.mfa_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mfa_settings_insert_own" ON public.mfa_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mfa_settings_update_own" ON public.mfa_settings FOR UPDATE USING (auth.uid() = user_id);

-- Create scheduled job to clean up expired sessions (requires pg_cron extension)
DO $do$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-expired-sessions',
      '0 * * * *', -- Every hour
      $$SELECT public.cleanup_expired_sessions()$$
    );
  END IF;
END $do$;

COMMENT ON TABLE public.sessions IS 'User session management with refresh token rotation';
COMMENT ON TABLE public.failed_login_attempts IS 'Tracks failed login attempts for account lockout';
COMMENT ON TABLE public.account_lockouts IS 'Tracks locked accounts';
COMMENT ON TABLE public.mfa_settings IS 'Multi-factor authentication settings';
COMMENT ON TABLE public.mfa_verifications IS 'MFA verification history';
