-- Phase 51-53: Knowledge Graph Enhancements
-- Add advanced knowledge graph features

-- Knowledge node versions
CREATE TABLE IF NOT EXISTS public.knowledge_node_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT,
  UNIQUE(node_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_node_versions_node ON public.knowledge_node_versions(node_id);

-- Knowledge graph queries
CREATE TABLE IF NOT EXISTS public.knowledge_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_queries_user ON public.knowledge_queries(user_id);

-- Knowledge graph analytics
CREATE TABLE IF NOT EXISTS public.knowledge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'node_count', 'edge_count', 'contradiction_count', etc.
  metric_value DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_analytics_user ON public.knowledge_analytics(user_id);

COMMENT ON TABLE public.knowledge_node_versions IS 'Version history for knowledge nodes';
COMMENT ON TABLE public.knowledge_queries IS 'Knowledge graph search queries';
COMMENT ON TABLE public.knowledge_analytics IS 'Knowledge graph analytics';
