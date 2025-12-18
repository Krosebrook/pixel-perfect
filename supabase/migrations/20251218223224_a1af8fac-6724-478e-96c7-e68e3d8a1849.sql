-- Create table to track login attempts
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT
);

-- Create index for efficient lookups
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts (ip_address, attempted_at DESC);

-- Enable RLS but allow inserts from edge functions
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy for service role only (edge functions)
CREATE POLICY "Service role can manage login attempts"
ON public.login_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.check_login_lockout(
  _email TEXT,
  _max_attempts INTEGER DEFAULT 5,
  _lockout_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(
  is_locked BOOLEAN,
  failed_attempts INTEGER,
  lockout_remaining_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _failed_count INTEGER;
  _last_failed TIMESTAMP WITH TIME ZONE;
  _lockout_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count failed attempts in the lockout window
  SELECT COUNT(*), MAX(attempted_at)
  INTO _failed_count, _last_failed
  FROM public.login_attempts
  WHERE email = LOWER(_email)
    AND success = false
    AND attempted_at > now() - (_lockout_minutes || ' minutes')::INTERVAL;

  -- Check if locked
  IF _failed_count >= _max_attempts AND _last_failed IS NOT NULL THEN
    _lockout_end := _last_failed + (_lockout_minutes || ' minutes')::INTERVAL;
    IF _lockout_end > now() THEN
      RETURN QUERY SELECT 
        true::BOOLEAN,
        _failed_count,
        EXTRACT(EPOCH FROM (_lockout_end - now()))::INTEGER;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT 
    false::BOOLEAN,
    _failed_count,
    0::INTEGER;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  _email TEXT,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _success BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (LOWER(_email), _ip_address, _user_agent, _success);
  
  -- Clean up old attempts (older than 24 hours) to prevent table bloat
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$;

-- Function to clear failed attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_failed_attempts(_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE email = LOWER(_email) AND success = false;
END;
$$;