-- Fix profiles table: users should only view their own profile
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix deployment_metrics: only admins should view deployment details
DROP POLICY IF EXISTS "Authenticated users can view deployment metrics" ON public.deployment_metrics;

-- Keep the admin policy that already exists (Admins can view all deployment metrics)