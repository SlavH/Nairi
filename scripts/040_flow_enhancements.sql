-- Phase 49-50: Flow Feed Enhancements
-- Add advanced feed features

-- Feed post collections
CREATE TABLE IF NOT EXISTS public.feed_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collection_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.feed_collections(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_posts_collection ON public.collection_posts(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_posts_post ON public.collection_posts(post_id);

-- Feed post tags
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_feed_posts_tags ON public.feed_posts USING GIN(tags);

-- Feed post mentions
CREATE TABLE IF NOT EXISTS public.post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_mentions_post ON public.post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_user ON public.post_mentions(mentioned_user_id);

COMMENT ON TABLE public.feed_collections IS 'User collections of feed posts';
COMMENT ON TABLE public.collection_posts IS 'Posts in collections';
COMMENT ON TABLE public.post_mentions IS 'User mentions in posts';
