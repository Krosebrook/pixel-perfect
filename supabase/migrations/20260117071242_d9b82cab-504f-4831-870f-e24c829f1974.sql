-- ============================================================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- These policies use USING (true) or WITH CHECK (true) which 
-- allows any authenticated user to modify data
-- ============================================================

-- 1. Fix ip_rate_limits - should only be accessible by service role
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role manages IP rate limits" ON public.ip_rate_limits;

-- Create proper restrictive policy - only service role via functions can access
CREATE POLICY "ip_rate_limits_service_only" 
ON public.ip_rate_limits 
FOR ALL 
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. Fix deployment_budgets - remove the permissive ALL policy
DROP POLICY IF EXISTS "Service role can manage deployment budgets" ON public.deployment_budgets;

-- Create admin-only policy for managing budgets
CREATE POLICY "Admins can manage deployment budgets" 
ON public.deployment_budgets 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix deployment_changelogs - restrict insert to admin only
DROP POLICY IF EXISTS "Service role can insert changelogs" ON public.deployment_changelogs;

CREATE POLICY "Admins can insert changelogs" 
ON public.deployment_changelogs 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix deployment_incidents - restrict insert/update to admin only
DROP POLICY IF EXISTS "Service role can insert deployment incidents" ON public.deployment_incidents;
DROP POLICY IF EXISTS "Service role can update deployment incidents" ON public.deployment_incidents;

CREATE POLICY "Admins can insert deployment incidents" 
ON public.deployment_incidents 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deployment incidents" 
ON public.deployment_incidents 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Fix security_audit_log - remove the permissive ALL policy, keep user-specific SELECT
DROP POLICY IF EXISTS "Service role manages audit logs" ON public.security_audit_log;

-- Create admin-only policy for managing audit logs
CREATE POLICY "Admins can manage audit logs" 
ON public.security_audit_log 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Fix api_rate_limits - remove the permissive ALL policy
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.api_rate_limits;

-- Create user-specific policies instead
CREATE POLICY "Users can insert their own rate limits" 
ON public.api_rate_limits 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rate limits" 
ON public.api_rate_limits 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- 7. Fix scheduled_test_results - restrict insert to test owner context
DROP POLICY IF EXISTS "Service role can insert test results" ON public.scheduled_test_results;

CREATE POLICY "Users can insert results for their tests" 
ON public.scheduled_test_results 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scheduled_tests st 
    WHERE st.id = scheduled_test_id 
    AND st.user_id = auth.uid()
  )
);

-- 8. Fix security_audit_log SELECT policy - remove email-based lookup which exposes data
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.security_audit_log;

CREATE POLICY "Users can view own audit logs by user_id" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());