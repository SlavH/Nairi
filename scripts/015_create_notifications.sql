-- Notifications System for Nairi
-- This migration creates the notifications table for user notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system', 'credits', 'marketplace', 'achievement')),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- RLS Policies
CREATE POLICY "notifications_select_own" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications 
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create a notification
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_url, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger to notify on new purchase (credits earned for creator)
DROP TRIGGER IF EXISTS trigger_notify_on_purchase ON public.product_purchases;
DROP FUNCTION IF EXISTS public.notify_on_purchase();
CREATE OR REPLACE FUNCTION public.notify_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_creator RECORD;
  v_commission INTEGER;
BEGIN
  -- Get product and creator info
  SELECT p.*, cp.user_id as creator_user_id 
  INTO v_product 
  FROM public.marketplace_products p
  JOIN public.creator_profiles cp ON p.creator_id = cp.id
  WHERE p.id = NEW.product_id;
  
  IF FOUND THEN
    -- Calculate 10% commission for marketplace sales credit
    v_commission := (NEW.amount_cents * 10) / 100;
    
    -- Notify creator of sale
    PERFORM public.create_notification(
      v_product.creator_user_id,
      'New Sale!',
      'Your product "' || v_product.title || '" was purchased for $' || (NEW.amount_cents / 100.0)::TEXT,
      'marketplace',
      '/marketplace/creator',
      jsonb_build_object('product_id', NEW.product_id, 'amount', NEW.amount_cents, 'commission', v_commission)
    );
    
    -- Update creator earnings
    UPDATE public.creator_profiles 
    SET total_earnings_cents = total_earnings_cents + v_commission
    WHERE user_id = v_product.creator_user_id;
    
    -- Award marketplace credits (10% of sale in credits)
    -- 1 credit = $0.01 for simplicity
    INSERT INTO public.daily_rewards (user_id, reward_type, credits_earned, metadata)
    VALUES (
      v_product.creator_user_id, 
      'marketplace', 
      GREATEST(v_commission / 10, 1), -- At least 1 credit
      jsonb_build_object('product_id', NEW.product_id, 'sale_amount', NEW.amount_cents)
    );
    
    UPDATE public.profiles 
    SET 
      tokens_balance = tokens_balance + GREATEST(v_commission / 10, 1),
      total_credits_earned = total_credits_earned + GREATEST(v_commission / 10, 1)
    WHERE id = v_product.creator_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for purchase notifications
CREATE TRIGGER trigger_notify_on_purchase
  AFTER INSERT ON public.product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_purchase();

-- Trigger to notify on new referral
DROP TRIGGER IF EXISTS trigger_notify_referral ON public.referrals;
DROP FUNCTION IF EXISTS public.notify_on_referral_complete();
CREATE OR REPLACE FUNCTION public.notify_on_referral_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    -- Notify referrer
    PERFORM public.create_notification(
      NEW.referrer_id,
      'Referral Bonus!',
      'Your friend joined Nairi! You earned ' || NEW.credits_awarded || ' credits.',
      'credits',
      '/dashboard',
      jsonb_build_object('credits', NEW.credits_awarded)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_referral
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_referral_complete();

-- Trigger to notify on daily streak milestone
DROP TRIGGER IF EXISTS trigger_streak_milestone ON public.profiles;
DROP FUNCTION IF EXISTS public.notify_streak_milestone();
CREATE OR REPLACE FUNCTION public.notify_streak_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify on streak milestones
  IF NEW.streak_days IN (7, 14, 30, 60, 90, 180, 365) THEN
    PERFORM public.create_notification(
      NEW.id,
      'Streak Milestone!',
      'Amazing! You''ve maintained a ' || NEW.streak_days || '-day streak!',
      'achievement',
      '/dashboard',
      jsonb_build_object('streak', NEW.streak_days)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_streak_milestone
  AFTER UPDATE OF streak_days ON public.profiles
  FOR EACH ROW
  WHEN (NEW.streak_days > OLD.streak_days)
  EXECUTE FUNCTION public.notify_streak_milestone();
