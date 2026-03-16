-- Create user_agents table for purchased/unlocked agents
CREATE TABLE IF NOT EXISTS public.user_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_agents_select_own" ON public.user_agents;
DROP POLICY IF EXISTS "user_agents_insert_own" ON public.user_agents;
DROP POLICY IF EXISTS "user_agents_delete_own" ON public.user_agents;
CREATE POLICY "user_agents_select_own" ON public.user_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_agents_insert_own" ON public.user_agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_agents_delete_own" ON public.user_agents FOR DELETE USING (auth.uid() = user_id);
