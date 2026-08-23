-- F16 (docs/AUDIT_TRIAGE.md): builder forks access control.
--
-- The builder_project_forks policies created by 001_enable_rls_all_tables.sql
-- reference a non-existent "user_id" column; the table's real column is
-- "forked_by" (030_builder_collaboration.sql). Depending on execution order
-- those policies either failed to create or deny every fork row, breaking
-- fork listing/inserts through the user-scoped client. Recreate them against
-- the correct column.

DROP POLICY IF EXISTS "Users can view own forks" ON public.builder_project_forks;
DROP POLICY IF EXISTS "Users can create own forks" ON public.builder_project_forks;

CREATE POLICY "Users can view own forks"
  ON public.builder_project_forks FOR SELECT
  USING (auth.uid() = forked_by);

CREATE POLICY "Users can create own forks"
  ON public.builder_project_forks FOR INSERT
  WITH CHECK (auth.uid() = forked_by);
