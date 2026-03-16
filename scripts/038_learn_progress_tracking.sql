-- Phase 46: Learn Progress Tracking and Analytics
-- Add progress tracking enhancements

-- Learning analytics
CREATE TABLE IF NOT EXISTS public.learning_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'time_spent', 'completion', 'quiz_score', etc.
  metric_value DECIMAL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_analytics_user ON public.learning_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_course ON public.learning_analytics(course_id);

-- Achievements system
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT,
  criteria JSONB NOT NULL, -- Conditions to unlock
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- Learning recommendations
CREATE TABLE IF NOT EXISTS public.learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  reason TEXT,
  score DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user ON public.learning_recommendations(user_id);

COMMENT ON TABLE public.learning_analytics IS 'Learning progress analytics';
COMMENT ON TABLE public.achievements IS 'Learning achievements';
COMMENT ON TABLE public.user_achievements IS 'User unlocked achievements';
COMMENT ON TABLE public.learning_recommendations IS 'Personalized learning recommendations';
