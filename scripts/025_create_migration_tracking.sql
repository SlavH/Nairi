-- Migration Status Tracking Table
-- Tracks which migrations have been applied and when

CREATE TABLE IF NOT EXISTS public.migration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL UNIQUE,
  migration_number INTEGER NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT,
  checksum TEXT, -- SHA256 hash of migration file for verification
  rollback_script TEXT, -- Path to rollback script
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'rolled_back', 'failed')),
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_status_number ON public.migration_status(migration_number);
CREATE INDEX IF NOT EXISTS idx_migration_status_name ON public.migration_status(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_status_status ON public.migration_status(status);

-- Function to record migration application
DROP FUNCTION IF EXISTS public.record_migration(TEXT, INTEGER, TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION public.record_migration(
  p_migration_name TEXT,
  p_migration_number INTEGER,
  p_checksum TEXT,
  p_rollback_script TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.migration_status (
    migration_name,
    migration_number,
    checksum,
    rollback_script,
    execution_time_ms,
    status
  )
  VALUES (
    p_migration_name,
    p_migration_number,
    p_checksum,
    p_rollback_script,
    p_execution_time_ms,
    'applied'
  )
  ON CONFLICT (migration_name) DO UPDATE SET
    applied_at = NOW(),
    checksum = EXCLUDED.checksum,
    rollback_script = EXCLUDED.rollback_script,
    execution_time_ms = EXCLUDED.execution_time_ms,
    status = 'applied',
    error_message = NULL
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Function to record migration rollback
DROP FUNCTION IF EXISTS public.record_migration_rollback(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.record_migration_rollback(
  p_migration_name TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.migration_status
  SET 
    status = 'rolled_back',
    error_message = p_error_message
  WHERE migration_name = p_migration_name;
  
  RETURN FOUND;
END;
$$;

-- Function to check if migration has been applied
DROP FUNCTION IF EXISTS public.is_migration_applied(TEXT);
CREATE OR REPLACE FUNCTION public.is_migration_applied(p_migration_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.migration_status 
    WHERE migration_name = p_migration_name 
    AND status = 'applied'
  );
END;
$$;

-- View for migration status overview
CREATE OR REPLACE VIEW public.migration_status_overview AS
SELECT 
  migration_number,
  migration_name,
  status,
  applied_at,
  execution_time_ms,
  CASE 
    WHEN status = 'applied' THEN '✓'
    WHEN status = 'rolled_back' THEN '↩'
    WHEN status = 'failed' THEN '✗'
    ELSE '?'
  END as status_icon
FROM public.migration_status
ORDER BY migration_number;

-- Grant access
GRANT SELECT ON public.migration_status TO authenticated;
GRANT SELECT ON public.migration_status_overview TO authenticated;
