-- Create account activity log table
CREATE TABLE public.account_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  ip_address text,
  user_agent text,
  location text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view their own activity"
ON public.account_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert activity
CREATE POLICY "Service role can insert activity"
ON public.account_activity
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_account_activity_user_id ON public.account_activity(user_id);
CREATE INDEX idx_account_activity_created_at ON public.account_activity(created_at DESC);