-- =============================================================================
-- 048: Flow social features — likes, comments, follows-ready feed_posts
-- Makes /flow a working social feed:
--   * feed_posts gains title/media/visibility/denormalized counters
--   * post_likes  — one like per user per post, counter kept by trigger
--   * post_comments — flat comments, counter kept by trigger
--   * follows handled by existing public.user_follows (045)
-- Idempotent: safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. feed_posts columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS title         TEXT;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS media_url     TEXT;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS media_type    TEXT
  CHECK (media_type IS NULL OR media_type IN ('image','video','code','website','simulation'));
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS visibility    TEXT NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public','followers','private'));
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS likes_count    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS shares_count   INTEGER NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "feed_posts_read" ON public.feed_posts;
CREATE POLICY "feed_posts_read" ON public.feed_posts
  FOR SELECT USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (
      visibility = 'followers'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_follows f
        WHERE f.follower_id = auth.uid() AND f.following_id = feed_posts.user_id
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 2. post_likes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_likes_read" ON public.post_likes;
CREATE POLICY "post_likes_read" ON public.post_likes
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "post_likes_insert_own" ON public.post_likes;
CREATE POLICY "post_likes_insert_own" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_delete_own" ON public.post_likes;
CREATE POLICY "post_likes_delete_own" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. post_comments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_comments_read" ON public.post_comments;
CREATE POLICY "post_comments_read" ON public.post_comments
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "post_comments_insert_own" ON public.post_comments;
CREATE POLICY "post_comments_insert_own" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_comments_delete_own" ON public.post_comments;
CREATE POLICY "post_comments_delete_own" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Counter maintenance triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sync_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.feed_posts
  SET likes_count = (
        SELECT COUNT(*) FROM public.post_likes WHERE post_id = NEW.post_id
      ),
      updated_at = NOW()
  WHERE id = NEW.post_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_post_likes_count();

CREATE OR REPLACE FUNCTION public.fn_sync_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.feed_posts
  SET comments_count = (
        SELECT COUNT(*) FROM public.post_comments WHERE post_id = NEW.post_id
      ),
      updated_at = NOW()
  WHERE id = NEW.post_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_post_comments_count();

-- -----------------------------------------------------------------------------
-- 5. Seed counters from existing rows (idempotent backfill)
-- -----------------------------------------------------------------------------
UPDATE public.feed_posts p
SET likes_count    = GREATEST(p.likes_count, (SELECT COUNT(*) FROM public.post_likes l WHERE l.post_id = p.id)),
    comments_count = GREATEST(p.comments_count, (SELECT COUNT(*) FROM public.post_comments c WHERE c.post_id = p.id))
WHERE TRUE;
