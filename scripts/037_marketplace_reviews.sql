-- Phase 44: Marketplace Reviews & Ratings
CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent ON public.agent_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_user ON public.agent_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_rating ON public.agent_reviews(agent_id, rating);

-- Review moderation
CREATE TABLE IF NOT EXISTS public.review_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.agent_reviews(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderated_by UUID REFERENCES auth.users(id),
  moderation_reason TEXT,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_moderation_review ON public.review_moderation(review_id);
CREATE INDEX IF NOT EXISTS idx_review_moderation_status ON public.review_moderation(status);

-- Function to update agent rating
CREATE OR REPLACE FUNCTION public.update_agent_rating(p_agent_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating DECIMAL;
  v_review_count INTEGER;
BEGIN
  SELECT AVG(rating)::DECIMAL(3,2), COUNT(*)::INTEGER
  INTO v_avg_rating, v_review_count
  FROM public.agent_reviews
  WHERE agent_id = p_agent_id
    AND EXISTS (
      SELECT 1 FROM public.review_moderation rm
      WHERE rm.review_id = agent_reviews.id
      AND rm.status = 'approved'
    );
  
  UPDATE public.agents
  SET rating = COALESCE(v_avg_rating, 0),
      review_count = COALESCE(v_review_count, 0)
  WHERE id = p_agent_id;
END;
$$;

-- Trigger to update rating on review insert/update
CREATE OR REPLACE FUNCTION public.trigger_update_agent_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_agent_rating(NEW.agent_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_agent_rating_on_review ON public.agent_reviews;
CREATE TRIGGER update_agent_rating_on_review
  AFTER INSERT OR UPDATE ON public.agent_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_agent_rating();

-- Enable RLS
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_moderation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "reviews_select_public" ON public.agent_reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.review_moderation rm
    WHERE rm.review_id = agent_reviews.id
    AND rm.status = 'approved'
  )
  OR auth.uid() = user_id
);

CREATE POLICY "reviews_insert_own" ON public.agent_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON public.agent_reviews FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE public.agent_reviews IS 'Agent reviews and ratings';
COMMENT ON TABLE public.review_moderation IS 'Review moderation queue';
