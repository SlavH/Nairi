-- Create creations table for multi-format creation system
CREATE TABLE IF NOT EXISTS creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  options JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_creations_user_id ON creations(user_id);

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS idx_creations_type ON creations(type);

-- Create index for public/featured creations
CREATE INDEX IF NOT EXISTS idx_creations_public ON creations(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE creations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own creations
DROP POLICY IF EXISTS "Users can view own creations" ON creations;
DROP POLICY IF EXISTS "Anyone can view public creations" ON creations;
DROP POLICY IF EXISTS "Users can create creations" ON creations;
DROP POLICY IF EXISTS "Users can update own creations" ON creations;
DROP POLICY IF EXISTS "Users can delete own creations" ON creations;
CREATE POLICY "Users can view own creations"
  ON creations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can view public creations
CREATE POLICY "Anyone can view public creations"
  ON creations FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Policy: Users can create their own creations
CREATE POLICY "Users can create creations"
  ON creations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own creations
CREATE POLICY "Users can update own creations"
  ON creations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own creations
CREATE POLICY "Users can delete own creations"
  ON creations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create activity_logs table for security features
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('auth', 'creation', 'chat', 'marketplace', 'settings', 'security')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user activity lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);

-- Create index for recent activity
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own activity logs
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: System can insert activity logs (using service role)
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to log activity
DROP FUNCTION IF EXISTS log_user_activity(UUID, TEXT, TEXT, TEXT, JSONB, TEXT);
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_category TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, action, category, description, metadata, risk_level)
  VALUES (p_user_id, p_action, p_category, p_description, p_metadata, p_risk_level)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create projects table for workspace organization
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#e879f9',
  icon TEXT DEFAULT 'folder',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own projects
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add project_id to creations (optional association)
ALTER TABLE creations ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for project creations
CREATE INDEX IF NOT EXISTS idx_creations_project_id ON creations(project_id);
