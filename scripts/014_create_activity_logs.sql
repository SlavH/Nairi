-- Activity Logs and Execution Traces for Nairi
-- This migration adds comprehensive activity logging and AI execution tracking

-- Create activity_logs table for user activity tracking
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('auth', 'creation', 'chat', 'marketplace', 'settings', 'security')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON public.activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_risk_level ON public.activity_logs(risk_level);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select_own" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_own" ON public.activity_logs;
CREATE POLICY "activity_logs_select_own" ON public.activity_logs 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_insert_own" ON public.activity_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create execution_traces table for AI operation tracking
CREATE TABLE IF NOT EXISTS public.execution_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  creation_id UUID,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('chat', 'creation', 'analysis', 'code_generation', 'search', 'tool_call')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  provider TEXT,
  model TEXT,
  input_summary TEXT,
  output_summary TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  trace_data JSONB DEFAULT '{}',
  parent_trace_id UUID REFERENCES public.execution_traces(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_traces_user_id ON public.execution_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_conversation_id ON public.execution_traces(conversation_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_status ON public.execution_traces(status);
CREATE INDEX IF NOT EXISTS idx_execution_traces_created_at ON public.execution_traces(created_at DESC);

ALTER TABLE public.execution_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "execution_traces_select_own" ON public.execution_traces;
DROP POLICY IF EXISTS "execution_traces_insert_own" ON public.execution_traces;
DROP POLICY IF EXISTS "execution_traces_update_own" ON public.execution_traces;
CREATE POLICY "execution_traces_select_own" ON public.execution_traces 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "execution_traces_insert_own" ON public.execution_traces 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "execution_traces_update_own" ON public.execution_traces 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system', 'achievement', 'referral', 'credits')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_system" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications 
  FOR DELETE USING (auth.uid() = user_id);

-- Create critical_confirmations table for operations requiring approval
CREATE TABLE IF NOT EXISTS public.critical_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  operation_description TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('medium', 'high', 'critical')),
  required_approval BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes',
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_critical_confirmations_user_id ON public.critical_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_critical_confirmations_status ON public.critical_confirmations(status);

ALTER TABLE public.critical_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "critical_confirmations_select_own" ON public.critical_confirmations;
DROP POLICY IF EXISTS "critical_confirmations_insert_own" ON public.critical_confirmations;
DROP POLICY IF EXISTS "critical_confirmations_update_own" ON public.critical_confirmations;
CREATE POLICY "critical_confirmations_select_own" ON public.critical_confirmations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "critical_confirmations_insert_own" ON public.critical_confirmations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "critical_confirmations_update_own" ON public.critical_confirmations 
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to log activity
DROP FUNCTION IF EXISTS public.log_activity(UUID, TEXT, TEXT, TEXT, JSONB, TEXT);
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_category TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (user_id, action, category, description, metadata, risk_level)
  VALUES (p_user_id, p_action, p_category, p_description, p_metadata, p_risk_level)
  RETURNING id INTO v_log_id;
  
  -- Create notification for high-risk activities
  IF p_risk_level IN ('high', 'critical') THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      p_user_id, 
      'warning',
      'Security Alert',
      'A ' || p_risk_level || ' risk activity was detected: ' || p_action,
      jsonb_build_object('activity_log_id', v_log_id, 'category', p_category)
    );
  END IF;
  
  RETURN v_log_id;
END;
$$;

-- Function to start an execution trace
DROP FUNCTION IF EXISTS public.start_execution_trace(UUID, TEXT, UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.start_execution_trace(
  p_user_id UUID,
  p_operation_type TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_input_summary TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trace_id UUID;
BEGIN
  INSERT INTO public.execution_traces (
    user_id, operation_type, conversation_id, input_summary, 
    provider, model, status, started_at
  )
  VALUES (
    p_user_id, p_operation_type, p_conversation_id, p_input_summary,
    p_provider, p_model, 'running', NOW()
  )
  RETURNING id INTO v_trace_id;
  
  RETURN v_trace_id;
END;
$$;

-- Function to complete an execution trace
DROP FUNCTION IF EXISTS public.complete_execution_trace(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.complete_execution_trace(
  p_trace_id UUID,
  p_status TEXT,
  p_output_summary TEXT DEFAULT NULL,
  p_tokens_input INTEGER DEFAULT 0,
  p_tokens_output INTEGER DEFAULT 0,
  p_credits_consumed INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_trace_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_duration_ms INTEGER;
BEGIN
  SELECT started_at INTO v_started_at FROM public.execution_traces WHERE id = p_trace_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_started_at)) * 1000;
  
  UPDATE public.execution_traces SET
    status = p_status,
    output_summary = p_output_summary,
    tokens_input = p_tokens_input,
    tokens_output = p_tokens_output,
    credits_consumed = p_credits_consumed,
    error_message = p_error_message,
    trace_data = p_trace_data,
    duration_ms = v_duration_ms,
    completed_at = NOW()
  WHERE id = p_trace_id;
  
  RETURN TRUE;
END;
$$;

-- Function to send notification
DROP FUNCTION IF EXISTS public.send_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, action_url, action_label, metadata
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_action_url, p_action_label, p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;
