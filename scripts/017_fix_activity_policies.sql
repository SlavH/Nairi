-- Fix activity logs RLS policies (idempotent)
-- Run this if you get policy already exists errors

-- Activity logs policies
DROP POLICY IF EXISTS "activity_logs_select_own" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_own" ON public.activity_logs;

CREATE POLICY "activity_logs_select_own" ON public.activity_logs 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_insert_own" ON public.activity_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Execution traces policies
DROP POLICY IF EXISTS "execution_traces_select_own" ON public.execution_traces;
DROP POLICY IF EXISTS "execution_traces_insert_own" ON public.execution_traces;
DROP POLICY IF EXISTS "execution_traces_update_own" ON public.execution_traces;

CREATE POLICY "execution_traces_select_own" ON public.execution_traces 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "execution_traces_insert_own" ON public.execution_traces 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "execution_traces_update_own" ON public.execution_traces 
  FOR UPDATE USING (auth.uid() = user_id);

-- Critical confirmations policies
DROP POLICY IF EXISTS "critical_confirmations_select_own" ON public.critical_confirmations;
DROP POLICY IF EXISTS "critical_confirmations_insert_own" ON public.critical_confirmations;
DROP POLICY IF EXISTS "critical_confirmations_update_own" ON public.critical_confirmations;

CREATE POLICY "critical_confirmations_select_own" ON public.critical_confirmations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "critical_confirmations_insert_own" ON public.critical_confirmations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "critical_confirmations_update_own" ON public.critical_confirmations 
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies (already fixed in 015)
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
