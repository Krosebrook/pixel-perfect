-- ============================================================
-- FIX REMAINING OVERLY PERMISSIVE RLS POLICIES
-- ============================================================

-- 1. Fix account_activity - change INSERT policy to user-specific
DROP POLICY IF EXISTS "Service role can insert activity" ON public.account_activity;

CREATE POLICY "Users can insert their own activity" 
ON public.account_activity 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Fix ip_rate_limits - the previous policy blocks all authenticated users
-- This table should only be accessible by the database functions (not direct client access)
-- Drop the false policy and ensure no direct client access is needed
DROP POLICY IF EXISTS "ip_rate_limits_service_only" ON public.ip_rate_limits;

-- No policy needed - functions run with security definer context
-- Just ensure RLS is enabled but no client policies exist

-- 3. Fix login_attempts table if it has permissive policies
DROP POLICY IF EXISTS "Service role manages login attempts" ON public.login_attempts;

-- Create restrictive policy - this table should be managed by security functions only
CREATE POLICY "login_attempts_no_client_access" 
ON public.login_attempts 
FOR ALL 
TO authenticated
USING (false)
WITH CHECK (false);