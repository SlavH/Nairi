-- Nairi Flow - Reels & Publications Feed Tables

-- Publications (Instagram-like posts)
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  publication_type TEXT DEFAULT 'post' CHECK (publication_type IN ('post', 'reel', 'thread', 'article')),
  media_urls TEXT[] DEFAULT '{}',
  embedded_content JSONB, -- For embedded AI outputs, code, designs
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_educational BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reels (short-form video/slide content)
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT, -- Video or slide deck URL
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  reel_type TEXT DEFAULT 'video' CHECK (reel_type IN ('video', 'slides', 'animation', 'explainer')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_educational BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  can_convert_to_course BOOLEAN DEFAULT TRUE, -- Can this be expanded to a lesson/course?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge threads (posts that grow over time)
CREATE TABLE IF NOT EXISTS public.knowledge_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  initial_content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_open_for_annotations BOOLEAN DEFAULT TRUE,
  ai_summary TEXT, -- AI-curated summary
  contribution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread contributions (community annotations)
CREATE TABLE IF NOT EXISTS public.thread_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.knowledge_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  contribution_type TEXT DEFAULT 'addition' CHECK (contribution_type IN ('addition', 'correction', 'example', 'question')),
  upvotes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feed interactions (likes, saves, etc.)
CREATE TABLE IF NOT EXISTS public.feed_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('publication', 'reel', 'thread')),
  content_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'save', 'share', 'view', 'hide')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id, interaction_type)
);

-- Comments on feed content
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('publication', 'reel', 'thread', 'lesson')),
  content_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai_enhanced BOOLEAN DEFAULT FALSE, -- AI-powered context-aware comment
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User follow relationships
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- User feed preferences
CREATE TABLE IF NOT EXISTS public.feed_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_mode TEXT DEFAULT 'discovery' CHECK (feed_mode IN ('focus', 'learning', 'discovery')),
  preferred_categories TEXT[] DEFAULT '{}',
  blocked_categories TEXT[] DEFAULT '{}',
  learning_goals TEXT[] DEFAULT '{}',
  content_complexity TEXT DEFAULT 'mixed' CHECK (content_complexity IN ('beginner', 'intermediate', 'advanced', 'mixed')),
  daily_time_limit_minutes INTEGER, -- Anti-dopamine abuse
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "publications_read" ON public.publications;
DROP POLICY IF EXISTS "publications_own" ON public.publications;
DROP POLICY IF EXISTS "reels_read" ON public.reels;
DROP POLICY IF EXISTS "reels_own" ON public.reels;
DROP POLICY IF EXISTS "threads_read" ON public.knowledge_threads;
DROP POLICY IF EXISTS "threads_own" ON public.knowledge_threads;
DROP POLICY IF EXISTS "contributions_read" ON public.thread_contributions;
DROP POLICY IF EXISTS "contributions_own" ON public.thread_contributions;
DROP POLICY IF EXISTS "interactions_own" ON public.feed_interactions;
DROP POLICY IF EXISTS "comments_read" ON public.comments;
DROP POLICY IF EXISTS "comments_own" ON public.comments;
DROP POLICY IF EXISTS "follows_own" ON public.follows;
DROP POLICY IF EXISTS "follows_read" ON public.follows;
DROP POLICY IF EXISTS "feed_prefs_own" ON public.feed_preferences;
CREATE POLICY "publications_read" ON public.publications FOR SELECT USING (is_published = TRUE OR auth.uid() = user_id);
CREATE POLICY "publications_own" ON public.publications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reels_read" ON public.reels FOR SELECT USING (TRUE);
CREATE POLICY "reels_own" ON public.reels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "threads_read" ON public.knowledge_threads FOR SELECT USING (TRUE);
CREATE POLICY "threads_own" ON public.knowledge_threads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "contributions_read" ON public.thread_contributions FOR SELECT USING (TRUE);
CREATE POLICY "contributions_own" ON public.thread_contributions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "interactions_own" ON public.feed_interactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "comments_read" ON public.comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_own" ON public.comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "follows_own" ON public.follows FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "follows_read" ON public.follows FOR SELECT USING (TRUE);
CREATE POLICY "feed_prefs_own" ON public.feed_preferences FOR ALL USING (auth.uid() = user_id);
