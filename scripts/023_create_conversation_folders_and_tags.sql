-- Pillar B: Conversation folders, tags, shared links
CREATE TABLE IF NOT EXISTS public.conversation_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversation_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "folders_select_own" ON public.conversation_folders;
DROP POLICY IF EXISTS "folders_insert_own" ON public.conversation_folders;
DROP POLICY IF EXISTS "folders_update_own" ON public.conversation_folders;
DROP POLICY IF EXISTS "folders_delete_own" ON public.conversation_folders;
CREATE POLICY "folders_select_own" ON public.conversation_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "folders_insert_own" ON public.conversation_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "folders_update_own" ON public.conversation_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "folders_delete_own" ON public.conversation_folders FOR DELETE USING (auth.uid() = user_id);

-- Add folder_id, tags, shared_slug, shared_expires_at to conversations (run only if columns don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'folder_id') THEN
    ALTER TABLE public.conversations ADD COLUMN folder_id UUID REFERENCES public.conversation_folders(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'tags') THEN
    ALTER TABLE public.conversations ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'shared_slug') THEN
    ALTER TABLE public.conversations ADD COLUMN shared_slug TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'shared_expires_at') THEN
    ALTER TABLE public.conversations ADD COLUMN shared_expires_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_folder ON public.conversations(folder_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON public.conversations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_conversations_shared_slug ON public.conversations(shared_slug) WHERE shared_slug IS NOT NULL;

-- Allow public read of conversation when shared_slug is set and not expired (for shared links)
DROP POLICY IF EXISTS "conversations_select_own" ON public.conversations;
CREATE POLICY "conversations_select_own" ON public.conversations FOR SELECT USING (
  auth.uid() = user_id
  OR (shared_slug IS NOT NULL AND (shared_expires_at IS NULL OR shared_expires_at > NOW()))
);

-- Allow reading messages when conversation is shared (for shared link view)
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.shared_slug IS NOT NULL
      AND (c.shared_expires_at IS NULL OR c.shared_expires_at > NOW())
  )
);
