-- Rollback script for 048_session_remove_raw_refresh_token.sql
-- The raw column is restored nullable: rows purged by 048 have no value to recover.
BEGIN;

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS refresh_token TEXT UNIQUE;

COMMIT;
