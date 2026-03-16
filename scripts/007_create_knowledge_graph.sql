-- Knowledge Graph Tables for Cognitive Layer
-- Stores user's personal knowledge, beliefs, and learning progress

-- User knowledge nodes (concepts, facts, beliefs the user has learned/stated)
CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('concept', 'fact', 'belief', 'skill', 'goal')),
  title TEXT NOT NULL,
  content TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- How confident user is (0-1)
  source_type TEXT, -- 'learned', 'stated', 'inferred'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections between knowledge nodes
CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('supports', 'contradicts', 'requires', 'related', 'derived_from')),
  strength DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track belief contradictions for the AI to reference
CREATE TABLE IF NOT EXISTS public.belief_contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belief_a_id UUID REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  belief_b_id UUID REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT
);

ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belief_contradictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_nodes_own" ON public.knowledge_nodes;
DROP POLICY IF EXISTS "knowledge_edges_own" ON public.knowledge_edges;
DROP POLICY IF EXISTS "belief_contradictions_own" ON public.belief_contradictions;
CREATE POLICY "knowledge_nodes_own" ON public.knowledge_nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "knowledge_edges_own" ON public.knowledge_edges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "belief_contradictions_own" ON public.belief_contradictions FOR ALL USING (auth.uid() = user_id);
