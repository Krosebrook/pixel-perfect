-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view deployment incidents" ON public.deployment_incidents;

-- Create policy for authenticated users to view deployment incidents
CREATE POLICY "Authenticated users can view deployment incidents"
ON public.deployment_incidents
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create policy for admins to view all deployment incidents
CREATE POLICY "Admins can view all deployment incidents"
ON public.deployment_incidents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));