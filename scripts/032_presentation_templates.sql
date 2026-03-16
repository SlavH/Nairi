-- Phase 28: Presentation Templates and Custom Branding
CREATE TABLE IF NOT EXISTS public.presentation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  style TEXT,
  theme TEXT,
  slides JSONB NOT NULL, -- Template slide structure
  branding_config JSONB, -- Colors, fonts, logos
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presentation_templates_category ON public.presentation_templates(category);
CREATE INDEX IF NOT EXISTS idx_presentation_templates_public ON public.presentation_templates(is_public) WHERE is_public = true;

-- Presentation custom branding
CREATE TABLE IF NOT EXISTS public.presentation_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  font_family TEXT,
  logo_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_presentation_branding_user ON public.presentation_branding(user_id);

-- Presentation analytics
CREATE TABLE IF NOT EXISTS public.presentation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL, -- References creations table
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presentation_analytics_presentation ON public.presentation_analytics(presentation_id);

COMMENT ON TABLE public.presentation_templates IS 'Reusable presentation templates';
COMMENT ON TABLE public.presentation_branding IS 'User custom branding for presentations';
COMMENT ON TABLE public.presentation_analytics IS 'Presentation usage analytics';
