-- Add policy for admins to view all account activity
CREATE POLICY "Admins can view all account activity"
ON public.account_activity
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));