-- Allow multiple migrations to share the same number (e.g. 025_add_agents and 025_create_migration_tracking)
ALTER TABLE public.migration_status DROP CONSTRAINT IF EXISTS migration_status_migration_number_key;

-- Add is_published to agents for marketplace filtering (recommendations, trending)
-- Default true so existing agents remain visible
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
COMMENT ON COLUMN public.agents.is_published IS 'When false, agent is hidden from marketplace and recommendations';
