-- Add progress_percentage to lesson_progress for app compatibility.
-- App previously used user_lesson_progress (or expected these columns); standardize on lesson_progress.

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

COMMENT ON COLUMN public.lesson_progress.progress_percentage IS '0-100 progress within the lesson (optional; completed=true implies 100).';
