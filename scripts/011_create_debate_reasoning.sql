-- Debate, Thinking & Reasoning Mode Tables

-- Debate sessions
CREATE TABLE IF NOT EXISTS public.debate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  user_position TEXT,
  ai_position TEXT,
  debate_mode TEXT DEFAULT 'structured' CHECK (debate_mode IN ('structured', 'socratic', 'devil_advocate', 'multi_agent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  total_rounds INTEGER DEFAULT 0,
  user_score DECIMAL(5,2) DEFAULT 0, -- Argument strength scoring
  ai_score DECIMAL(5,2) DEFAULT 0,
  fallacies_detected JSONB DEFAULT '[]',
  learning_outcomes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Individual debate arguments
CREATE TABLE IF NOT EXISTS public.debate_arguments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.debate_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'strategist', 'critic', 'optimist', 'engineer')),
  content TEXT NOT NULL,
  argument_type TEXT, -- 'claim', 'evidence', 'rebuttal', 'concession'
  strength_score DECIMAL(3,2),
  fallacies TEXT[], -- Detected logical fallacies
  round_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-agent reasoning sessions
CREATE TABLE IF NOT EXISTS public.reasoning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  reasoning_type TEXT DEFAULT 'multi_agent' CHECK (reasoning_type IN ('multi_agent', 'chain_of_thought', 'tree_of_thought')),
  agents_involved TEXT[] DEFAULT '{}', -- ['strategist', 'critic', 'optimist', 'engineer']
  consensus_reached BOOLEAN DEFAULT FALSE,
  final_output TEXT,
  confidence_score DECIMAL(3,2),
  reasoning_trace JSONB, -- Full reasoning process
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI response metadata (for explain-why and confidence)
CREATE TABLE IF NOT EXISTS public.ai_response_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2),
  assumptions TEXT[],
  reasoning_steps TEXT[],
  sources_used TEXT[],
  model_used TEXT,
  fallback_tier INTEGER, -- Which tier of fallback system was used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals and action plans
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT DEFAULT 'learning' CHECK (goal_type IN ('learning', 'creation', 'career', 'personal', 'project')),
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress_percent INTEGER DEFAULT 0,
  ai_breakdown JSONB, -- AI-generated action breakdown
  daily_actions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal action items (daily tasks)
CREATE TABLE IF NOT EXISTS public.goal_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  action_type TEXT DEFAULT 'task' CHECK (action_type IN ('task', 'learning', 'creation', 'review')),
  scheduled_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.debate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasoning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "debate_sessions_own" ON public.debate_sessions;
DROP POLICY IF EXISTS "debate_arguments_own" ON public.debate_arguments;
DROP POLICY IF EXISTS "reasoning_sessions_own" ON public.reasoning_sessions;
DROP POLICY IF EXISTS "ai_response_metadata_own" ON public.ai_response_metadata;
DROP POLICY IF EXISTS "user_goals_own" ON public.user_goals;
DROP POLICY IF EXISTS "goal_actions_own" ON public.goal_actions;
CREATE POLICY "debate_sessions_own" ON public.debate_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "debate_arguments_own" ON public.debate_arguments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.debate_sessions WHERE id = session_id AND user_id = auth.uid())
);
CREATE POLICY "reasoning_sessions_own" ON public.reasoning_sessions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ai_metadata_own" ON public.ai_response_metadata;
CREATE POLICY "ai_metadata_own" ON public.ai_response_metadata FOR ALL USING (
  EXISTS (SELECT 1 FROM public.messages WHERE id = message_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "goals_own" ON public.user_goals;
CREATE POLICY "goals_own" ON public.user_goals FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "goal_actions_own" ON public.goal_actions;
CREATE POLICY "goal_actions_own" ON public.goal_actions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_goals WHERE id = goal_id AND user_id = auth.uid())
);
