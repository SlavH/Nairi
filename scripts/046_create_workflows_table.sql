-- Workflows: persist user-defined workflows
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Workflow',
  description TEXT DEFAULT '',
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  variables JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  triggers JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_updated_at ON public.workflows(updated_at DESC);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflows_select_own" ON public.workflows;
DROP POLICY IF EXISTS "workflows_insert_own" ON public.workflows;
DROP POLICY IF EXISTS "workflows_update_own" ON public.workflows;
DROP POLICY IF EXISTS "workflows_delete_own" ON public.workflows;

CREATE POLICY "workflows_select_own" ON public.workflows
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "workflows_insert_own" ON public.workflows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workflows_update_own" ON public.workflows
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workflows_delete_own" ON public.workflows
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
