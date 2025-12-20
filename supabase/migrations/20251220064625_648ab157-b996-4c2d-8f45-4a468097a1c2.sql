-- Fix overly permissive RLS policy on deployment_budgets
-- Remove the "Anyone can view deployment budgets" policy and replace with authenticated-only

DROP POLICY IF EXISTS "Anyone can view deployment budgets" ON public.deployment_budgets;

-- Only authenticated users can view deployment budgets (for dashboard display)
CREATE POLICY "Authenticated users can view deployment budgets" 
ON public.deployment_budgets 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Also fix deployment_alerts which has similar issue
DROP POLICY IF EXISTS "Anyone can view deployment alerts" ON public.deployment_alerts;

CREATE POLICY "Authenticated users can view deployment alerts" 
ON public.deployment_alerts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix deployment_changelogs to require authentication for viewing
DROP POLICY IF EXISTS "Anyone can view deployment changelogs" ON public.deployment_changelogs;

CREATE POLICY "Authenticated users can view deployment changelogs" 
ON public.deployment_changelogs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);