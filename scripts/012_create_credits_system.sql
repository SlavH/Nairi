-- Credits System for Nairi
-- This migration adds comprehensive credits tracking, earning, and consumption

-- Add onboarding and credits fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS daily_credits INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS total_credits_earned INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS total_credits_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- Generate unique referral codes for existing users
UPDATE public.profiles 
SET referral_code = CONCAT('NAIRI-', UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)))
WHERE referral_code IS NULL;

-- Create credits transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'referral', 'reset', 'purchase')),
  category TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_transactions_select_own" ON public.credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert_own" ON public.credit_transactions;
CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_transactions_insert_own" ON public.credit_transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_awarded INTEGER DEFAULT 500,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'invalid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own" ON public.referrals 
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Create daily rewards tracking table
CREATE TABLE IF NOT EXISTS public.daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('watch', 'activity', 'streak', 'marketplace')),
  credits_earned INTEGER NOT NULL,
  reward_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reward_type, reward_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_date ON public.daily_rewards(user_id, reward_date);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_rewards_select_own" ON public.daily_rewards;
DROP POLICY IF EXISTS "daily_rewards_insert_own" ON public.daily_rewards;
CREATE POLICY "daily_rewards_select_own" ON public.daily_rewards 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_rewards_insert_own" ON public.daily_rewards 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to reset daily credits
DROP FUNCTION IF EXISTS public.reset_daily_credits(UUID);
CREATE OR REPLACE FUNCTION public.reset_daily_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_credits INTEGER := 1000;
  v_streak_bonus INTEGER := 0;
  v_current_streak INTEGER;
BEGIN
  -- Get current streak
  SELECT streak_days INTO v_current_streak 
  FROM public.profiles WHERE id = p_user_id;
  
  -- Calculate streak bonus (up to 2x = 1000 bonus credits at 30 day streak)
  v_streak_bonus := LEAST(v_current_streak * 33, 1000);
  v_new_credits := v_new_credits + v_streak_bonus;
  
  -- Update profile
  UPDATE public.profiles SET
    tokens_balance = v_new_credits,
    credits_reset_at = NOW() + INTERVAL '24 hours',
    total_credits_earned = total_credits_earned + v_new_credits
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, category, description)
  VALUES (p_user_id, v_new_credits, 'reset', 'daily_reset', 
          'Daily credits reset with ' || v_streak_bonus || ' streak bonus');
  
  RETURN v_new_credits;
END;
$$;

-- Function to update activity streak
DROP FUNCTION IF EXISTS public.update_activity_streak(UUID);
CREATE OR REPLACE FUNCTION public.update_activity_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_active DATE;
  v_new_streak INTEGER;
BEGIN
  SELECT last_active_date, streak_days INTO v_last_active, v_new_streak
  FROM public.profiles WHERE id = p_user_id;
  
  IF v_last_active = CURRENT_DATE - 1 THEN
    -- Consecutive day, increment streak
    v_new_streak := v_new_streak + 1;
  ELSIF v_last_active < CURRENT_DATE - 1 THEN
    -- Missed a day, reset streak
    v_new_streak := 1;
  END IF;
  
  UPDATE public.profiles SET
    streak_days = v_new_streak,
    last_active_date = CURRENT_DATE
  WHERE id = p_user_id;
  
  RETURN v_new_streak;
END;
$$;

-- Function to award referral credits
DROP FUNCTION IF EXISTS public.award_referral_credits(UUID);
CREATE OR REPLACE FUNCTION public.award_referral_credits(p_referred_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral RECORD;
  v_credits_amount INTEGER := 500;
BEGIN
  -- Find pending referral
  SELECT * INTO v_referral FROM public.referrals 
  WHERE referred_id = p_referred_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Award credits to referrer
  UPDATE public.profiles SET
    tokens_balance = tokens_balance + v_credits_amount,
    total_credits_earned = total_credits_earned + v_credits_amount
  WHERE id = v_referral.referrer_id;
  
  -- Log transaction for referrer
  INSERT INTO public.credit_transactions (user_id, amount, type, category, description)
  VALUES (v_referral.referrer_id, v_credits_amount, 'referral', 'friend_signup', 
          'Referral bonus for inviting a friend');
  
  -- Award credits to referred user too
  UPDATE public.profiles SET
    tokens_balance = tokens_balance + v_credits_amount,
    total_credits_earned = total_credits_earned + v_credits_amount
  WHERE id = p_referred_id;
  
  -- Log transaction for referred
  INSERT INTO public.credit_transactions (user_id, amount, type, category, description)
  VALUES (p_referred_id, v_credits_amount, 'bonus', 'referral_signup', 
          'Welcome bonus for joining via referral');
  
  -- Mark referral as completed
  UPDATE public.referrals SET
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_referral.id;
  
  RETURN TRUE;
END;
$$;

-- Function to consume credits
DROP FUNCTION IF EXISTS public.consume_credits(UUID, INTEGER, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT tokens_balance INTO v_current_balance
  FROM public.profiles WHERE id = p_user_id;
  
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.profiles SET
    tokens_balance = tokens_balance - p_amount,
    total_credits_spent = total_credits_spent + p_amount
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, category, description)
  VALUES (p_user_id, -p_amount, 'spent', p_category, p_description);
  
  RETURN TRUE;
END;
$$;

-- Update handle_new_user function to include credits initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
BEGIN
  -- Generate unique referral code
  v_referral_code := CONCAT('NAIRI-', UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8)));
  
  -- Check if user was referred
  IF NEW.raw_user_meta_data ? 'referral_code' THEN
    SELECT id INTO v_referrer_id FROM public.profiles 
    WHERE referral_code = NEW.raw_user_meta_data ->> 'referral_code';
  END IF;
  
  -- Insert profile with initial credits
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    tokens_balance,
    daily_credits,
    credits_reset_at,
    referral_code,
    referred_by,
    total_credits_earned
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    1000,
    1000,
    NOW() + INTERVAL '24 hours',
    v_referral_code,
    v_referrer_id,
    1000
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Log initial credits
  INSERT INTO public.credit_transactions (user_id, amount, type, category, description)
  VALUES (NEW.id, 1000, 'bonus', 'signup', 'Welcome credits for new users');
  
  -- Create referral record if applicable
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_referrer_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;
