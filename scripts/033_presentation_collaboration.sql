-- Phase 29: Presentation Collaboration
CREATE TABLE IF NOT EXISTS public.presentation_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL, -- References creations table
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer', 'commenter')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(presentation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_presentation_collaborators_presentation ON public.presentation_collaborators(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_collaborators_user ON public.presentation_collaborators(user_id);

-- Presentation comments
CREATE TABLE IF NOT EXISTS public.presentation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL,
  slide_id INTEGER,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES public.presentation_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presentation_comments_presentation ON public.presentation_comments(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_comments_slide ON public.presentation_comments(slide_id);
CREATE INDEX IF NOT EXISTS idx_presentation_comments_user ON public.presentation_comments(user_id);

-- Presentation version history
CREATE TABLE IF NOT EXISTS public.presentation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT,
  UNIQUE(presentation_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_presentation_versions_presentation ON public.presentation_versions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_versions_version ON public.presentation_versions(presentation_id, version_number DESC);

-- Presentation sharing
ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS shared_slug TEXT UNIQUE;
ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS shared_expires_at TIMESTAMPTZ;
ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS share_permissions TEXT DEFAULT 'view' CHECK (share_permissions IN ('view', 'edit', 'comment'));

CREATE INDEX IF NOT EXISTS idx_creations_shared_slug ON public.creations(shared_slug) WHERE shared_slug IS NOT NULL;

-- Enable RLS
ALTER TABLE public.presentation_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "presentation_collaborators_select" ON public.presentation_collaborators FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.creations WHERE id = presentation_id AND user_id = auth.uid())
);

CREATE POLICY "presentation_comments_select" ON public.presentation_comments FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.presentation_collaborators WHERE presentation_id = presentation_comments.presentation_id AND user_id = auth.uid())
);

CREATE POLICY "presentation_versions_select" ON public.presentation_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.presentation_collaborators WHERE presentation_id = presentation_versions.presentation_id AND user_id = auth.uid())
);

COMMENT ON TABLE public.presentation_collaborators IS 'Presentation collaborators with roles';
COMMENT ON TABLE public.presentation_comments IS 'Comments and suggestions on presentations';
COMMENT ON TABLE public.presentation_versions IS 'Presentation version history';
