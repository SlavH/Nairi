-- Fix credits system RLS policies (idempotent)
-- Run this if you get policy already exists errors

-- Credit transactions policies
DROP POLICY IF EXISTS "credit_transactions_select_own" ON public.credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert_own" ON public.credit_transactions;

CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_transactions_insert_own" ON public.credit_transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals policies
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;

CREATE POLICY "referrals_select_own" ON public.referrals 
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Daily rewards policies
DROP POLICY IF EXISTS "daily_rewards_select_own" ON public.daily_rewards;
DROP POLICY IF EXISTS "daily_rewards_insert_own" ON public.daily_rewards;

CREATE POLICY "daily_rewards_select_own" ON public.daily_rewards 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_rewards_insert_own" ON public.daily_rewards 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
