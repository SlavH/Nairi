-- Phase 48: Debate System Enhancements
-- Add debate analytics and voting

-- Debate votes
CREATE TABLE IF NOT EXISTS public.debate_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.debate_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL, -- Which side they voted for
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_debate_votes_session ON public.debate_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_debate_votes_user ON public.debate_votes(user_id);

-- Debate analytics
CREATE TABLE IF NOT EXISTS public.debate_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.debate_sessions(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'view_count', 'share_count', 'engagement_score'
  metric_value DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debate_analytics_session ON public.debate_analytics(session_id);

COMMENT ON TABLE public.debate_votes IS 'User votes on debate positions';
COMMENT ON TABLE public.debate_analytics IS 'Debate session analytics';
