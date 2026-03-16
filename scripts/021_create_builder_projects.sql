-- Builder projects: persist builder state (files + optional name) per user
CREATE TABLE IF NOT EXISTS public.builder_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled project',
  files JSONB NOT NULL DEFAULT '[]',
  versions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_projects_user_id ON public.builder_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_projects_updated_at ON public.builder_projects(updated_at DESC);

ALTER TABLE public.builder_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own builder projects" ON public.builder_projects;
DROP POLICY IF EXISTS "Users can create builder projects" ON public.builder_projects;
DROP POLICY IF EXISTS "Users can update own builder projects" ON public.builder_projects;
DROP POLICY IF EXISTS "Users can delete own builder projects" ON public.builder_projects;
CREATE POLICY "Users can view own builder projects"
  ON public.builder_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create builder projects"
  ON public.builder_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own builder projects"
  ON public.builder_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own builder projects"
  ON public.builder_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
