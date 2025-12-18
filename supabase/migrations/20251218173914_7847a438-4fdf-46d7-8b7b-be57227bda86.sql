-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view deployment metrics" ON public.deployment_metrics;

-- Create policy for authenticated users to view deployment metrics
CREATE POLICY "Authenticated users can view deployment metrics"
ON public.deployment_metrics
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add policy for admins to have full visibility (including for dashboards)
CREATE POLICY "Admins can view all deployment metrics"
ON public.deployment_metrics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));