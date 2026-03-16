-- Pillar C: Builder deploy history and usage tracking
CREATE TABLE IF NOT EXISTS public.builder_deploys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.builder_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('vercel', 'netlify')),
  url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.builder_deploys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "builder_deploys_select_own" ON public.builder_deploys;
DROP POLICY IF EXISTS "builder_deploys_insert_own" ON public.builder_deploys;
CREATE POLICY "builder_deploys_select_own" ON public.builder_deploys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "builder_deploys_insert_own" ON public.builder_deploys FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.builder_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('generate', 'deploy')),
  project_id UUID REFERENCES public.builder_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_usage_user_created ON public.builder_usage(user_id, created_at DESC);
ALTER TABLE public.builder_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "builder_usage_select_own" ON public.builder_usage;
DROP POLICY IF EXISTS "builder_usage_insert_own" ON public.builder_usage;
CREATE POLICY "builder_usage_select_own" ON public.builder_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "builder_usage_insert_own" ON public.builder_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
