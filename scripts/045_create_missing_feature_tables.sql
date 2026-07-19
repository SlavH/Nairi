-- =============================================================================
-- 045_create_missing_feature_tables.sql
--
-- PURPOSE
-- -------
-- This migration fills the gap between application code and the SQL schema.
-- Several tables are referenced by the app via `supabase.from("<table>")` but
-- were never created by any prior migration file. As a result `npm run migrate`
-- left them missing and the corresponding features failed at runtime (they
-- currently fail-open / swallow errors).
--
-- This file creates all of those missing tables, enables Row Level Security
-- (RLS) on each, and adds sensible owner-scoped policies so the features work
-- securely once the schema is complete.
--
-- Covers tables referenced by:
--   - lib/ip-rate-limiter.ts            -> signup_attempts
--   - app/api/generate-image/character/ -> characters
--   - app/api/contact/route.ts          -> contact_submissions
--   - app/api/upload/route.ts           -> files, uploads
--   - app/api/flow/route.ts, fullscreen -> feed_posts, flow_stories
--   - app/settings/page.tsx             -> user_ai_settings
--   - feed algorithm code               -> user_follows, user_preferences
--   - app/api/prompts/route.ts          -> prompt_templates
--
-- IDEMPOTENCY
-- -----------
-- Every table uses CREATE TABLE IF NOT EXISTS. RLS policies use the same
-- DROP POLICY IF EXISTS + CREATE POLICY pattern used across the rest of the
-- migration set, so the file is safe to re-run.
--
-- NOTE ON feed_posts
-- ------------------
-- scripts/040_flow_enhancements.sql already references public.feed_posts
-- (ADD COLUMN tags, REFERENCES feed_posts(id)). In fresh deploys this file
-- runs AFTER 040, so we CREATE TABLE IF NOT EXISTS WITH the `tags` column
-- already present to keep things consistent. On existing deploys feed_posts
-- already exists, so the IF NOT EXISTS guard is a no-op and the tags column
-- (added by 040) remains intact.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. signup_attempts  (lib/ip-rate-limiter.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  TEXT NOT NULL,
  email       TEXT,
  success     BOOLEAN,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signup_attempts_service_read" ON public.signup_attempts;
CREATE POLICY "signup_attempts_service_read" ON public.signup_attempts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 2. characters  (app/api/generate-image/character/route.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.characters (
  id               TEXT PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT,
  description      TEXT,
  reference_image  TEXT,
  face_embedding   JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "characters_own" ON public.characters;
CREATE POLICY "characters_own" ON public.characters
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "characters_read" ON public.characters;
CREATE POLICY "characters_read" ON public.characters
  FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. contact_submissions  (app/api/contact/route.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT,
  email       TEXT,
  reason      TEXT,
  subject     TEXT,
  message     TEXT,
  status      TEXT DEFAULT 'new',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_submissions_insert" ON public.contact_submissions;
CREATE POLICY "contact_submissions_insert" ON public.contact_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contact_submissions_read" ON public.contact_submissions;
CREATE POLICY "contact_submissions_read" ON public.contact_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. files  (app/api/upload/route.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- conversation_id references public.conversations(id) (created in 004).
  -- Declared as a plain nullable UUID to avoid cross-migration FK ordering
  -- issues; the app always supplies it when linking a file to a chat.
  conversation_id UUID,
  category        TEXT,
  url             TEXT,
  "extractedText" TEXT,
  file_name       TEXT,
  file_size       BIGINT,
  mime_type       TEXT,
  -- Columns actually written by app/api/upload/route.ts (kept for parity)
  filename        TEXT,
  storage_path    TEXT,
  size            BIGINT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_user_conv ON public.files(user_id, conversation_id);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "files_own" ON public.files;
CREATE POLICY "files_own" ON public.files
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "files_read" ON public.files;
CREATE POLICY "files_read" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. uploads  (app/api/upload/route.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uploads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name   TEXT,
  file_path   TEXT,
  file_size   BIGINT,
  mime_type   TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uploads_own" ON public.uploads;
CREATE POLICY "uploads_own" ON public.uploads
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "uploads_read" ON public.uploads;
CREATE POLICY "uploads_read" ON public.uploads
  FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. feed_posts  (app/api/flow/route.ts, fullscreen pages, 040 references it)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_posts_read" ON public.feed_posts;
CREATE POLICY "feed_posts_read" ON public.feed_posts
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "feed_posts_own" ON public.feed_posts;
CREATE POLICY "feed_posts_own" ON public.feed_posts
  FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 7. flow_stories  (app/(fullscreen)/community/.../page.tsx)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.flow_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flow_stories_read" ON public.flow_stories;
CREATE POLICY "flow_stories_read" ON public.flow_stories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "flow_stories_own" ON public.flow_stories;
CREATE POLICY "flow_stories_own" ON public.flow_stories
  FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 8. user_ai_settings  (app/settings/page.tsx)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ai_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_ai_settings_own" ON public.user_ai_settings;
CREATE POLICY "user_ai_settings_own" ON public.user_ai_settings
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_ai_settings_read" ON public.user_ai_settings;
CREATE POLICY "user_ai_settings_read" ON public.user_ai_settings
  FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 9. user_follows  (feed algorithm code) -- distinct from the existing "follows"
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_follows_read" ON public.user_follows;
CREATE POLICY "user_follows_read" ON public.user_follows
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "user_follows_own" ON public.user_follows;
CREATE POLICY "user_follows_own" ON public.user_follows
  FOR ALL USING (auth.uid() = follower_id);

-- -----------------------------------------------------------------------------
-- 10. user_preferences  (feed algorithm code)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences  JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_own" ON public.user_preferences;
CREATE POLICY "user_preferences_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_read" ON public.user_preferences;
CREATE POLICY "user_preferences_read" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 11. prompt_templates  (app/api/prompts/route.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  content     TEXT,
  category    TEXT,
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prompt_templates_read" ON public.prompt_templates;
CREATE POLICY "prompt_templates_read" ON public.prompt_templates
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "prompt_templates_own" ON public.prompt_templates;
CREATE POLICY "prompt_templates_own" ON public.prompt_templates
  FOR ALL USING (auth.uid() = user_id);
