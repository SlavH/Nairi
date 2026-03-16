-- Rollback script for 002_create_agents.sql
BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "agents_select_public" ON public.agents;
DROP POLICY IF EXISTS "agents_insert_own" ON public.agents;
DROP POLICY IF EXISTS "agents_update_own" ON public.agents;
DROP POLICY IF EXISTS "agents_delete_own" ON public.agents;

-- Drop table
DROP TABLE IF EXISTS public.agents CASCADE;

COMMIT;
