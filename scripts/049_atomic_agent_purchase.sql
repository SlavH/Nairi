-- F36 (docs/AUDIT_TRIAGE.md): marketplace agent purchase double-spend atomicity.
-- The purchase/install routes did "check ownership, read balance, decrement
-- balance, insert user_agents" across separate statements, so concurrent
-- requests could double-spend credits and double-grant ownership.
--
-- Fix: move the whole mutation into one SECURITY DEFINER function, following
-- the F25 pattern (20260823_f25_atomic_rewards_and_referrals.sql):
-- - INSERT-first into user_agents relies on UNIQUE(user_id, agent_id) so a
--   concurrent duplicate loses with unique_violation and is reported as
--   already_owned (idempotent per user+agent, no double grant, no charge).
-- - The buyer's profile row is locked FOR UPDATE before the balance check, so
--   concurrent credit purchases by the same user serialize and can never
--   drive the balance below zero.
-- - Balance/usage counters are updated with atomic increments
--   (tokens_balance = tokens_balance - cost), never read-modify-write.
-- Credit cost formula must stay in sync with the routes and the UI:
--   ceil(price_cents / 10), i.e. 10 cents = 1 credit.
-- Requires 047_allow_marketplace_credit_types.sql (marketplace_* transaction
-- types must be allowed by the credit_transactions_type_check constraint).

BEGIN;

DROP FUNCTION IF EXISTS public.purchase_agent_atomic(UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.purchase_agent_atomic(
  p_user_id UUID,
  p_agent_id UUID,
  p_use_credits BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent RECORD;
  v_cost INTEGER := 0;
  v_balance INTEGER;
  v_share INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_agent_id IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'invalid_params');
  END IF;

  SELECT * INTO v_agent
  FROM public.agents
  WHERE id = p_agent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'agent_not_found');
  END IF;

  IF v_agent.is_free OR COALESCE(v_agent.price_cents, 0) = 0 THEN
    v_cost := 0;
  ELSIF p_use_credits THEN
    v_cost := ceil(v_agent.price_cents / 10.0)::INTEGER;
  ELSE
    RETURN jsonb_build_object('ok', FALSE, 'error', 'payment_required');
  END IF;

  IF v_cost > 0 THEN
    SELECT tokens_balance INTO v_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', FALSE, 'error', 'profile_not_found');
    END IF;

    IF COALESCE(v_balance, 0) < v_cost THEN
      RETURN jsonb_build_object(
        'ok', FALSE,
        'error', 'insufficient_credits',
        'required', v_cost,
        'available', COALESCE(v_balance, 0)
      );
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.user_agents (user_id, agent_id, purchased_at, purchase_type, credits_spent)
    VALUES (
      p_user_id,
      p_agent_id,
      NOW(),
      CASE WHEN v_cost > 0 THEN 'credits' ELSE 'free' END,
      v_cost
    );
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', TRUE, 'already_owned', TRUE);
  END;

  IF v_cost > 0 THEN
    UPDATE public.profiles
    SET tokens_balance = COALESCE(tokens_balance, 0) - v_cost,
        total_credits_spent = COALESCE(total_credits_spent, 0) + v_cost,
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, type, category, description, metadata)
    VALUES (
      p_user_id,
      -v_cost,
      'marketplace_purchase',
      'agent_purchase',
      'Purchased agent: ' || v_agent.name,
      jsonb_build_object('agentId', p_agent_id, 'agentName', v_agent.name)
    );

    IF v_agent.creator_id IS NOT NULL THEN
      v_share := floor(v_cost * 0.7)::INTEGER;
      IF v_share > 0 THEN
        UPDATE public.profiles
        SET tokens_balance = COALESCE(tokens_balance, 0) + v_share,
            total_credits_earned = COALESCE(total_credits_earned, 0) + v_share,
            updated_at = NOW()
        WHERE id = v_agent.creator_id;

        INSERT INTO public.credit_transactions (user_id, amount, type, category, description, metadata)
        VALUES (
          v_agent.creator_id,
          v_share,
          'marketplace_sale',
          'agent_sale',
          'Sale of agent: ' || v_agent.name,
          jsonb_build_object('agentId', p_agent_id, 'buyerId', p_user_id)
        );
      END IF;
    END IF;
  END IF;

  UPDATE public.agents
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = p_agent_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'already_owned', FALSE,
    'credits_spent', v_cost,
    'new_balance', CASE WHEN v_cost > 0 THEN COALESCE(v_balance, 0) - v_cost ELSE NULL END,
    'agent', to_jsonb(v_agent)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_agent_atomic(UUID, UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_agent_atomic(UUID, UUID, BOOLEAN) TO authenticated;

COMMIT;
