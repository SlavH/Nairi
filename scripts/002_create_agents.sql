-- Create agents table for marketplace
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_cents INTEGER DEFAULT 0,
  icon TEXT,
  capabilities TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to read agents (public marketplace)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agents_select_all" ON public.agents;
CREATE POLICY "agents_select_all" ON public.agents FOR SELECT TO authenticated, anon USING (true);

-- Insert default agents (only if they don't exist)
INSERT INTO public.agents (name, description, category, price_cents, icon, capabilities, is_featured, is_free) 
SELECT * FROM (VALUES
('Research Assistant', 'Deep research and analysis agent for any topic', 'Research', 0, 'search', ARRAY['Web Search', 'Data Analysis', 'Report Generation'], true, true),
('Code Helper', 'Expert coding assistant for any programming language', 'Development', 0, 'code', ARRAY['Code Review', 'Bug Fixing', 'Optimization'], true, true),
('Writing Pro', 'Professional writing and editing assistant', 'Content', 1999, 'pen-tool', ARRAY['Content Writing', 'Editing', 'SEO'], true, false),
('Data Analyst', 'Advanced data processing and visualization', 'Analytics', 2999, 'bar-chart', ARRAY['Data Processing', 'Visualization', 'Insights'], false, false),
('Social Media Manager', 'Automate your social media presence', 'Marketing', 3999, 'share-2', ARRAY['Scheduling', 'Analytics', 'Content Creation'], false, false),
('Customer Support', 'AI-powered customer service agent', 'Support', 4999, 'headphones', ARRAY['24/7 Support', 'Multi-language', 'Ticket Management'], true, false),
('Finance Advisor', 'Personal finance and investment guidance', 'Finance', 5999, 'dollar-sign', ARRAY['Budgeting', 'Investment', 'Tax Planning'], false, false),
('Legal Assistant', 'Document review and legal research', 'Legal', 9999, 'file-text', ARRAY['Contract Review', 'Legal Research', 'Compliance'], false, false)
) AS v(name, description, category, price_cents, icon, capabilities, is_featured, is_free)
WHERE NOT EXISTS (SELECT 1 FROM public.agents WHERE agents.name = v.name);
