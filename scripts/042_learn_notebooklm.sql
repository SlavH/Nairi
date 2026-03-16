-- Learn: NairiBook notebooks and sources for grounded Q&A
-- Each notebook has many sources (pasted text, URLs); chat is grounded in these sources with citations.

CREATE TABLE IF NOT EXISTS public.learn_notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled notebook',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learn_notebook_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES public.learn_notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('paste', 'url')),
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learn_notebooks_user_id ON public.learn_notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_learn_notebook_sources_notebook_id ON public.learn_notebook_sources(notebook_id);

ALTER TABLE public.learn_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_notebook_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learn_notebooks_own" ON public.learn_notebooks;
DROP POLICY IF EXISTS "learn_notebook_sources_via_notebook" ON public.learn_notebook_sources;
CREATE POLICY "learn_notebooks_own" ON public.learn_notebooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "learn_notebook_sources_via_notebook" ON public.learn_notebook_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.learn_notebooks n WHERE n.id = notebook_id AND n.user_id = auth.uid())
);
