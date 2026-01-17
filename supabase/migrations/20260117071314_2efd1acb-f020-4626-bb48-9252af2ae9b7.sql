-- ============================================================
-- ADD POLICY FOR IP_RATE_LIMITS (INFO: RLS enabled but no policy)
-- This table needs at least one policy
-- ============================================================

-- Add a read-only policy for admins (so the table isn't completely locked)
CREATE POLICY "Admins can view ip rate limits" 
ON public.ip_rate_limits 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));