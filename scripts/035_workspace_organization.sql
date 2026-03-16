-- Phase 31-32: Workspace Organization and Collaboration
-- Add folders and tags to workspace (creations table)

-- Workspace folders
CREATE TABLE IF NOT EXISTS public.workspace_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.workspace_folders(id) ON DELETE CASCADE,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_folders_user ON public.workspace_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_folders_parent ON public.workspace_folders(parent_id);

-- Add folder_id and tags to creations if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creations' AND column_name = 'folder_id') THEN
    ALTER TABLE public.creations ADD COLUMN folder_id UUID REFERENCES public.workspace_folders(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creations' AND column_name = 'tags') THEN
    ALTER TABLE public.creations ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_creations_folder ON public.creations(folder_id);
CREATE INDEX IF NOT EXISTS idx_creations_tags ON public.creations USING GIN(tags);

-- Workspace sharing
CREATE TABLE IF NOT EXISTS public.workspace_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id UUID NOT NULL REFERENCES public.creations(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_with UUID REFERENCES auth.users(id), -- NULL for public share
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'comment')),
  shared_slug TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_shares_creation ON public.workspace_shares(creation_id);
CREATE INDEX IF NOT EXISTS idx_workspace_shares_shared_with ON public.workspace_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_workspace_shares_slug ON public.workspace_shares(shared_slug) WHERE shared_slug IS NOT NULL;

-- Workspace comments
CREATE TABLE IF NOT EXISTS public.workspace_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id UUID NOT NULL REFERENCES public.creations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES public.workspace_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_comments_creation ON public.workspace_comments(creation_id);
CREATE INDEX IF NOT EXISTS idx_workspace_comments_user ON public.workspace_comments(user_id);

-- Workspace activity feed
CREATE TABLE IF NOT EXISTS public.workspace_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id UUID REFERENCES public.creations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'shared', 'commented', 'deleted'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_activities_creation ON public.workspace_activities(creation_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activities_user ON public.workspace_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activities_created ON public.workspace_activities(created_at DESC);

-- Workspace templates
CREATE TABLE IF NOT EXISTS public.workspace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'presentation', 'document', 'website', etc.
  content JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_templates_type ON public.workspace_templates(type);
CREATE INDEX IF NOT EXISTS idx_workspace_templates_public ON public.workspace_templates(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE public.workspace_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "workspace_folders_select_own" ON public.workspace_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workspace_shares_select_own" ON public.workspace_shares FOR SELECT USING (
  auth.uid() = shared_by OR auth.uid() = shared_with OR shared_with IS NULL
);
CREATE POLICY "workspace_comments_select_creation" ON public.workspace_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_shares WHERE creation_id = workspace_comments.creation_id AND (shared_with = auth.uid() OR shared_with IS NULL))
  OR EXISTS (SELECT 1 FROM public.creations WHERE id = workspace_comments.creation_id AND user_id = auth.uid())
);

COMMENT ON TABLE public.workspace_folders IS 'Workspace folder organization';
COMMENT ON TABLE public.workspace_shares IS 'Workspace item sharing';
COMMENT ON TABLE public.workspace_comments IS 'Comments on workspace items';
COMMENT ON TABLE public.workspace_activities IS 'Workspace activity feed';
COMMENT ON TABLE public.workspace_templates IS 'Workspace item templates';
