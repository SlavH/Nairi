-- Phase 33-35: Studio Image/Video/Audio Gallery and Libraries
CREATE TABLE IF NOT EXISTS public.studio_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  title TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB, -- Model used, parameters, etc.
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_gallery_user ON public.studio_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_gallery_type ON public.studio_gallery(media_type);
CREATE INDEX IF NOT EXISTS idx_studio_gallery_tags ON public.studio_gallery USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_studio_gallery_created ON public.studio_gallery(created_at DESC);

-- Image editing history
CREATE TABLE IF NOT EXISTS public.image_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_image_id UUID NOT NULL REFERENCES public.studio_gallery(id) ON DELETE CASCADE,
  edited_image_id UUID NOT NULL REFERENCES public.studio_gallery(id) ON DELETE CASCADE,
  edit_type TEXT NOT NULL, -- 'enhance', 'filter', 'crop', 'resize', etc.
  edit_params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_edits_original ON public.image_edits(original_image_id);

-- Video editing history
CREATE TABLE IF NOT EXISTS public.video_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_video_id UUID NOT NULL REFERENCES public.studio_gallery(id) ON DELETE CASCADE,
  edited_video_id UUID NOT NULL REFERENCES public.studio_gallery(id) ON DELETE CASCADE,
  edit_type TEXT NOT NULL, -- 'trim', 'merge', 'effects', 'transitions', etc.
  edit_params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_edits_original ON public.video_edits(original_video_id);

-- Audio editing history
CREATE TABLE IF NOT EXISTS public.audio_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_audio_id UUID NOT NULL REFERENCES public.studio_gallery(id) ON DELETE CASCADE,
  edited_audio_id UUID NOT NULL REFERENCES public.studio_gallery(id) ON DELETE CASCADE,
  edit_type TEXT NOT NULL, -- 'trim', 'fade', 'effects', 'normalize', etc.
  edit_params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_edits_original ON public.audio_edits(original_audio_id);

-- Enable RLS
ALTER TABLE public.studio_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_edits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "studio_gallery_select_own" ON public.studio_gallery FOR SELECT USING (
  auth.uid() = user_id OR is_public = true
);

CREATE POLICY "studio_gallery_insert_own" ON public.studio_gallery FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.studio_gallery IS 'Studio media gallery (images, videos, audio)';
COMMENT ON TABLE public.image_edits IS 'Image editing history';
COMMENT ON TABLE public.video_edits IS 'Video editing history';
COMMENT ON TABLE public.audio_edits IS 'Audio editing history';
