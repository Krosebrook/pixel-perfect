-- ============================================================
-- FIX REMAINING OVERLY PERMISSIVE RLS POLICIES
-- ============================================================

-- 1. Fix deployment_alerts - restrict to admins only
DROP POLICY IF EXISTS "Service role can manage deployment alerts" ON public.deployment_alerts;

CREATE POLICY "Admins can manage deployment alerts" 
ON public.deployment_alerts 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix deployment_metrics - restrict INSERT/UPDATE to admins only
DROP POLICY IF EXISTS "Service role can insert deployment metrics" ON public.deployment_metrics;
DROP POLICY IF EXISTS "Service role can update deployment metrics" ON public.deployment_metrics;

CREATE POLICY "Admins can insert deployment metrics" 
ON public.deployment_metrics 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deployment metrics" 
ON public.deployment_metrics 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix login_attempts - already has a restrictive policy, just drop the old one if exists
DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.login_attempts;