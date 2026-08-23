-- F25 (docs/AUDIT_TRIAGE.md): credits earn TOCTOU, garbage profile update
-- (`rpc("", {})`), non-atomic balance read-modify-write, and referral flow
-- that inserted status='completed' so award_referral_credits (which only
-- matches 'pending') never paid anyone.
--
-- Fix: move each mutation into a single SECURITY DEFINER function.
-- - earn_daily_reward: insert-first into daily_rewards relies on the existing
--   UNIQUE(user_id, reward_type, reward_date) constraint to make double-claim
--   races impossible, then applies one atomic balance increment.
-- - claim_referral: validates code/self/duplicate server-side, inserts the
--   referral row with its DEFAULT 'pending' status, then calls the existing
--   award_referral_credits which flips it to 'completed' and pays both sides.
-- Amounts here must stay in sync with REWARD_AMOUNTS in app/api/credits/earn/route.ts
-- (kept there for the GET display endpoint).

DROP FUNCTION IF EXISTS public.earn_daily_reward(UUID, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.earn_daily_reward(
  p_user_id UUID,
  p_reward_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
  v_result JSONB;
BEGIN
  IF p_reward_type NOT IN ('watch', 'activity', 'streak') THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'invalid_reward_type');
  END IF;

  v_credits := CASE p_reward_type
    WHEN 'watch' THEN 50
    WHEN 'activity' THEN 25
    WHEN 'streak' THEN 100
  END;

  -- Insert-first: UNIQUE(user_id, reward_type, reward_date) makes this atomic.
  BEGIN
    INSERT INTO public.daily_rewards (user_id, reward_type, credits_earned, metadata)
    VALUES (p_user_id, p_reward_type, v_credits, COALESCE(p_metadata, '{}'::jsonb));
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', TRUE, 'already_claimed', TRUE);
  END;

  PERFORM public.update_activity_streak(p_user_id);

  UPDATE public.profiles
  SET tokens_balance = tokens_balance + v_credits,
      total_credits_earned = total_credits_earned + v_credits
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, category, description)
  VALUES (p_user_id, v_credits, 'earned', p_reward_type,
          'Daily ' || p_reward_type || ' reward');

  SELECT jsonb_build_object(
    'ok', TRUE,
    'already_claimed', FALSE,
    'credits_earned', v_credits,
    'new_balance', p.tokens_balance,
    'streak', p.streak_days
  ) INTO v_result
  FROM public.profiles p
  WHERE p.id = p_user_id;

  RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.claim_referral(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.claim_referral(
  p_referred_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_existing_id UUID;
BEGIN
  IF p_referral_code IS NULL OR length(btrim(p_referral_code)) = 0 THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'referral_code_required');
  END IF;

  SELECT id INTO v_referrer_id FROM public.profiles
  WHERE referral_code = btrim(p_referral_code);
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'invalid_code');
  END IF;

  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'self_referral');
  END IF;

  BEGIN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_referrer_id, p_referred_id); -- status defaults to 'pending'
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'already_referred');
  END;

  PERFORM public.award_referral_credits(p_referred_id);

  RETURN jsonb_build_object('ok', TRUE);
END;
$$;
