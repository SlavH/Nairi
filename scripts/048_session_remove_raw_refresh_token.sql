-- F45: stop persisting raw refresh tokens at rest.
-- lib/auth/session-manager.ts createSession/verifyAndRotateToken now write only
-- refresh_token_hash (sha256), which is the sole lookup key for rotation. The raw
-- refresh_token column was never read anywhere in the codebase, and 027 defined it
-- as TEXT NOT NULL UNIQUE, so inserts without it would fail until the column goes.
-- Dropping the column also purges raw tokens already stored on existing rows.
-- Idempotent: safe to re-run.

BEGIN;

ALTER TABLE public.sessions DROP COLUMN IF EXISTS refresh_token;

COMMIT;
