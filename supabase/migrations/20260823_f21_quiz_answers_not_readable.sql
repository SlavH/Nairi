-- F21 (docs/AUDIT_TRIAGE.md): quiz answers exposed.
--
-- 1. RLS: "quiz_questions_read" used USING (TRUE), letting anonymous callers
--    read every question row — including correct_answer and explanation —
--    directly via the PostgREST endpoint. Restrict reads to authenticated
--    sessions.
-- 2. App layer (this same change set): server components/APIs now strip
--    correct_answer/explanation before sending questions to the client
--    (lib/learn/quizzes.ts stripQuizAnswers).
--
-- Residual risk, documented deliberately: an authenticated user can still
-- read correct_answer for a quiz via direct REST calls, because grading runs
-- through the user-scoped client and column-level grants cannot distinguish
-- it from user traffic. Closing that fully requires moving answers to a
-- service-role-only table or grading via RPC — deferred as a larger change.

DROP POLICY IF EXISTS "quiz_questions_read" ON public.quiz_questions;
CREATE POLICY "quiz_questions_read" ON public.quiz_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
