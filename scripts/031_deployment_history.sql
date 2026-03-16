-- Phase 27: Deployment History Tracking
CREATE TABLE IF NOT EXISTS public.builder_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.builder_projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('vercel', 'netlify', 'github-pages')),
  deployment_id TEXT,
  url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'success', 'failed')),
  error_message TEXT,
  deployed_by UUID NOT NULL REFERENCES auth.users(id),
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_builder_deployments_project ON public.builder_deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_builder_deployments_status ON public.builder_deployments(status);
CREATE INDEX IF NOT EXISTS idx_builder_deployments_deployed_at ON public.builder_deployments(deployed_at DESC);

COMMENT ON TABLE public.builder_deployments IS 'Builder project deployment history';
