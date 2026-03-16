-- Allow PDF and file source types for NairiBook
ALTER TABLE public.learn_notebook_sources
  DROP CONSTRAINT IF EXISTS learn_notebook_sources_source_type_check;

ALTER TABLE public.learn_notebook_sources
  ADD CONSTRAINT learn_notebook_sources_source_type_check
  CHECK (source_type IN ('paste', 'url', 'pdf', 'file'));

COMMENT ON COLUMN public.learn_notebook_sources.source_type IS 'paste | url (auto-fetched) | pdf | file';
