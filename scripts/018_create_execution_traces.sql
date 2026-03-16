-- Create execution_traces table for AI operation transparency
CREATE TABLE IF NOT EXISTS execution_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('chat', 'creation', 'analysis', 'code_generation', 'search', 'tool_call')),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  
  -- Input/Output tracking
  input_summary TEXT,
  output_summary TEXT,
  
  -- Resource usage
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  
  -- Provider information
  provider TEXT,
  model TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Error handling
  error_message TEXT,
  
  -- Additional metadata (steps, tool calls, etc.)
  trace_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_execution_traces_user_id ON execution_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_created_at ON execution_traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_traces_operation_type ON execution_traces(operation_type);
CREATE INDEX IF NOT EXISTS idx_execution_traces_status ON execution_traces(status);
CREATE INDEX IF NOT EXISTS idx_execution_traces_conversation_id ON execution_traces(conversation_id);

-- Enable Row Level Security
ALTER TABLE execution_traces ENABLE ROW LEVEL SECURITY;

-- Users can only view their own traces
DROP POLICY IF EXISTS "Users can view own traces" ON execution_traces;
DROP POLICY IF EXISTS "Users can create own traces" ON execution_traces;
DROP POLICY IF EXISTS "Users can update own traces" ON execution_traces;
CREATE POLICY "Users can view own traces" ON execution_traces
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own traces
CREATE POLICY "Users can create own traces" ON execution_traces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own traces (for completion)
CREATE POLICY "Users can update own traces" ON execution_traces
  FOR UPDATE USING (auth.uid() = user_id);

-- Add helper function for incrementing tokens (used in purchases)
DROP FUNCTION IF EXISTS increment_tokens(UUID, INTEGER);
CREATE OR REPLACE FUNCTION increment_tokens(row_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles 
  SET tokens_balance = COALESCE(tokens_balance, 0) + amount
  WHERE id = row_id
  RETURNING tokens_balance INTO new_balance;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add scheduled_deletion_date to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'scheduled_deletion_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN scheduled_deletion_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add bio, website, company, location columns to profiles if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
    ALTER TABLE profiles ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
    ALTER TABLE profiles ADD COLUMN company TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
    ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_preferences') THEN
    ALTER TABLE profiles ADD COLUMN ai_preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add purchase_type and credits_spent to user_agents if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_agents' AND column_name = 'purchase_type') THEN
    ALTER TABLE user_agents ADD COLUMN purchase_type TEXT DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_agents' AND column_name = 'credits_spent') THEN
    ALTER TABLE user_agents ADD COLUMN credits_spent INTEGER DEFAULT 0;
  END IF;
END $$;
