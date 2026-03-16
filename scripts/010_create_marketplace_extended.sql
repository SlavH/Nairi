-- Extended Marketplace & Creator Economy Tables

-- Creator profiles
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  specializations TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  reputation_score DECIMAL(5,2) DEFAULT 0, -- Based on value, not popularity
  accuracy_score DECIMAL(3,2) DEFAULT 0, -- For educational content
  helpfulness_score DECIMAL(3,2) DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Marketplace products (prompts, tools, templates, courses)
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('prompt', 'template', 'tool', 'workflow', 'course', 'design', 'code')),
  price_cents INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  preview_content TEXT, -- Partial preview
  full_content TEXT, -- Full content (for prompts/templates)
  file_url TEXT, -- For downloadable products
  is_published BOOLEAN DEFAULT FALSE,
  purchase_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0',
  parent_product_id UUID REFERENCES public.marketplace_products(id), -- For forks/remixes
  license_type TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product purchases
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  stripe_payment_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Product reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Expert verification (proof-based expertise badges)
CREATE TABLE IF NOT EXISTS public.expert_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT,
  requirements TEXT, -- What's needed to earn this badge
  icon TEXT,
  color TEXT DEFAULT '#00c9c8'
);

-- User earned badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.expert_badges(id) ON DELETE CASCADE,
  earned_via TEXT, -- 'exam', 'contribution', 'verification'
  verification_data JSONB,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "creator_profiles_read" ON public.creator_profiles;
DROP POLICY IF EXISTS "creator_profiles_own" ON public.creator_profiles;
DROP POLICY IF EXISTS "products_read" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_own" ON public.marketplace_products;
DROP POLICY IF EXISTS "purchases_own" ON public.product_purchases;
DROP POLICY IF EXISTS "reviews_read" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_own" ON public.product_reviews;
DROP POLICY IF EXISTS "badges_read" ON public.expert_badges;
DROP POLICY IF EXISTS "user_badges_read" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_own" ON public.user_badges;
CREATE POLICY "creator_profiles_read" ON public.creator_profiles FOR SELECT USING (TRUE);
CREATE POLICY "creator_profiles_own" ON public.creator_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "products_read" ON public.marketplace_products FOR SELECT USING (is_published = TRUE);
CREATE POLICY "products_own" ON public.marketplace_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND user_id = auth.uid())
);
CREATE POLICY "purchases_own" ON public.product_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reviews_read" ON public.product_reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_own" ON public.product_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "badges_read" ON public.expert_badges FOR SELECT USING (TRUE);
CREATE POLICY "user_badges_read" ON public.user_badges FOR SELECT USING (TRUE);
CREATE POLICY "user_badges_own" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- Insert default expert badges (only if they don't exist)
INSERT INTO public.expert_badges (name, domain, description, requirements, icon, color)
SELECT * FROM (VALUES
  ('Programming Expert', 'programming', 'Verified expertise in software development', 'Pass advanced coding exam', 'code', '#00c9c8'),
  ('Data Science Pro', 'data_science', 'Proven data analysis and ML skills', 'Complete data science certification', 'bar-chart', '#e052a0'),
  ('Writing Master', 'writing', 'Excellence in written communication', 'Submit verified writing portfolio', 'pen-tool', '#8b5cf6'),
  ('Research Scholar', 'research', 'Deep research and analysis capabilities', 'Publish verified research contributions', 'search', '#f59e0b'),
  ('Design Expert', 'design', 'Professional design skills verified', 'Pass design assessment', 'palette', '#10b981')
) AS t(name, domain, description, requirements, icon, color);
