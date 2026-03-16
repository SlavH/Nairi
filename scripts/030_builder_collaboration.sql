-- Phase 24: Builder Project Collaboration
-- Adds collaboration features to builder projects

-- Project collaborators
CREATE TABLE IF NOT EXISTS public.builder_project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.builder_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_builder_collaborators_project ON public.builder_project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_builder_collaborators_user ON public.builder_project_collaborators(user_id);

-- Project templates
CREATE TABLE IF NOT EXISTS public.builder_project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  files JSONB NOT NULL,
  preview_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_builder_templates_category ON public.builder_project_templates(category);
CREATE INDEX IF NOT EXISTS idx_builder_templates_public ON public.builder_project_templates(is_public) WHERE is_public = true;

-- Project forks
CREATE TABLE IF NOT EXISTS public.builder_project_forks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_project_id UUID NOT NULL REFERENCES public.builder_projects(id) ON DELETE CASCADE,
  forked_project_id UUID NOT NULL REFERENCES public.builder_projects(id) ON DELETE CASCADE,
  forked_by UUID NOT NULL REFERENCES auth.users(id),
  forked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(forked_project_id)
);

CREATE INDEX IF NOT EXISTS idx_builder_forks_original ON public.builder_project_forks(original_project_id);
CREATE INDEX IF NOT EXISTS idx_builder_forks_user ON public.builder_project_forks(forked_by);

-- Add sharing fields to builder_projects if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'builder_projects' AND column_name = 'is_public') THEN
    ALTER TABLE public.builder_projects ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'builder_projects' AND column_name = 'shared_slug') THEN
    ALTER TABLE public.builder_projects ADD COLUMN shared_slug TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'builder_projects' AND column_name = 'template_id') THEN
    ALTER TABLE public.builder_projects ADD COLUMN template_id UUID REFERENCES public.builder_project_templates(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_builder_projects_public ON public.builder_projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_builder_projects_shared_slug ON public.builder_projects(shared_slug) WHERE shared_slug IS NOT NULL;

-- Enable RLS
ALTER TABLE public.builder_project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_project_forks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "collaborators_select_project" ON public.builder_project_collaborators;
DROP POLICY IF EXISTS "collaborators_insert_own" ON public.builder_project_collaborators;
DROP POLICY IF EXISTS "templates_select_public" ON public.builder_project_templates;
CREATE POLICY "collaborators_select_project" ON public.builder_project_collaborators FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.builder_projects WHERE id = project_id AND (user_id = auth.uid() OR is_public = true))
);

CREATE POLICY "collaborators_insert_own" ON public.builder_project_collaborators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.builder_projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "templates_select_public" ON public.builder_project_templates FOR SELECT USING (
  is_public = true OR created_by = auth.uid()
);

COMMENT ON TABLE public.builder_project_collaborators IS 'Project collaborators with roles';
COMMENT ON TABLE public.builder_project_templates IS 'Reusable project templates';
COMMENT ON TABLE public.builder_project_forks IS 'Project fork relationships';
