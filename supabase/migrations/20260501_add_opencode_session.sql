-- Add OpenCode session support to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS opencode_session_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS opencode_session_last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_opencode_session 
ON conversations(opencode_session_id) 
WHERE opencode_session_id IS NOT NULL;

-- Cleanup function: delete sessions older than 6 hours from OpenCode
-- (to be called periodically or on new session creation)
COMMENT ON COLUMN conversations.opencode_session_id IS 'OpenCode session ID for context reuse';
COMMENT ON COLUMN conversations.opencode_session_last_used IS 'Last time this OpenCode session was used';
