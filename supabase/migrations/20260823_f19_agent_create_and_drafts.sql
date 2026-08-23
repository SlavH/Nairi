-- F19 (docs/AUDIT_TRIAGE.md): agent create/edit dead + drafts public.
--
-- 1. create-agent-form sends `system_prompt` and the edit page selects it,
--    but the column never existed → every create/update failed with
--    PGRST204. Add it.
-- 2. agents had only "agents_select_all USING (true)" — no creator-owned
--    INSERT/UPDATE/DELETE policies, so user-session writes were denied by
--    RLS. Add ownership policies.
-- 3. Draft filtering itself is handled in code: public list/search/detail
--    now filter is_published = TRUE unless the viewer owns the agent.

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS system_prompt TEXT;

COMMENT ON COLUMN public.agents.system_prompt IS 'Behavior prompt for user-created agents; never exposed in public marketplace payloads.';

-- Creator-owned writes (marketplace drafts/publishing).
DROP POLICY IF EXISTS "agents_insert_own" ON public.agents;
DROP POLICY IF EXISTS "agents_update_own" ON public.agents;
DROP POLICY IF EXISTS "agents_delete_own" ON public.agents;

CREATE POLICY "agents_insert_own" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "agents_update_own" ON public.agents
  FOR UPDATE USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "agents_delete_own" ON public.agents
  FOR DELETE USING (auth.uid() = creator_id);
