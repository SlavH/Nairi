-- Phase 30: Document Templates and Versioning
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  document_type TEXT,
  content_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Template variables
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_templates_category ON public.document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON public.document_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_public ON public.document_templates(is_public) WHERE is_public = true;

-- Document versions (add to creations table if needed)
-- Versions are tracked via presentation_versions table pattern
-- For documents, we can reuse that or create document_versions

COMMENT ON TABLE public.document_templates IS 'Reusable document templates';
