-- F18 (docs/AUDIT_TRIAGE.md): "creator_profiles_own FOR ALL" allowed a
-- creator to UPDATE their own is_verified / follower_count /
-- total_earnings_cents / reputation_score — i.e. self-verification and
-- forged stats — and to delete the row.
--
-- Fix: split FOR ALL into INSERT/UPDATE/DELETE ownership policies and use
-- column-level UPDATE grants so creators can edit profile presentation
-- fields but never verification, counters, or earnings.

DROP POLICY IF EXISTS "creator_profiles_own" ON public.creator_profiles;

CREATE POLICY "creator_profiles_insert_own" ON public.creator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creator_profiles_update_own" ON public.creator_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creator_profiles_delete_own" ON public.creator_profiles
  FOR DELETE USING (auth.uid() = user_id);

REVOKE UPDATE ON TABLE public.creator_profiles FROM authenticated;

GRANT UPDATE (
  display_name,
  bio,
  avatar_url,
  banner_url,
  specializations
) ON public.creator_profiles TO authenticated;
