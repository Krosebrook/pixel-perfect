-- Add IP-based rate limiting tracking
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Index for efficient IP lookups
CREATE INDEX idx_ip_rate_limits_ip ON public.ip_rate_limits (ip_address);
CREATE INDEX idx_ip_rate_limits_blocked ON public.ip_rate_limits (is_blocked, blocked_until);

-- Enable RLS
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role policy
CREATE POLICY "Service role manages IP rate limits"
ON public.ip_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create security_audit_log table for comprehensive logging
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for audit log
CREATE INDEX idx_audit_log_user ON public.security_audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_log_email ON public.security_audit_log (email, created_at DESC);
CREATE INDEX idx_audit_log_event ON public.security_audit_log (event_type, created_at DESC);
CREATE INDEX idx_audit_log_ip ON public.security_audit_log (ip_address, created_at DESC);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Service role can manage all
CREATE POLICY "Service role manages audit logs"
ON public.security_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to check IP rate limit
CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(
  _ip_address TEXT,
  _max_attempts INTEGER DEFAULT 20,
  _window_minutes INTEGER DEFAULT 60,
  _block_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
  is_blocked BOOLEAN,
  failed_attempts INTEGER,
  block_remaining_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record RECORD;
  _window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  _window_start := now() - (_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create IP record
  SELECT * INTO _record FROM public.ip_rate_limits WHERE ip_address = _ip_address;
  
  IF _record IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 0, 0;
    RETURN;
  END IF;
  
  -- Check if currently blocked
  IF _record.is_blocked AND _record.blocked_until > now() THEN
    RETURN QUERY SELECT 
      true::BOOLEAN,
      _record.failed_attempts,
      EXTRACT(EPOCH FROM (_record.blocked_until - now()))::INTEGER;
    RETURN;
  END IF;
  
  -- Reset if outside window
  IF _record.first_attempt_at < _window_start THEN
    UPDATE public.ip_rate_limits 
    SET failed_attempts = 0, first_attempt_at = now(), is_blocked = false, blocked_until = NULL
    WHERE ip_address = _ip_address;
    RETURN QUERY SELECT false::BOOLEAN, 0, 0;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    false::BOOLEAN,
    _record.failed_attempts,
    0;
END;
$$;

-- Function to record IP failed attempt
CREATE OR REPLACE FUNCTION public.record_ip_failed_attempt(
  _ip_address TEXT,
  _max_attempts INTEGER DEFAULT 20,
  _block_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
  is_blocked BOOLEAN,
  failed_attempts INTEGER,
  block_remaining_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record RECORD;
  _new_attempts INTEGER;
BEGIN
  -- Upsert IP record
  INSERT INTO public.ip_rate_limits (ip_address, failed_attempts, first_attempt_at, last_attempt_at)
  VALUES (_ip_address, 1, now(), now())
  ON CONFLICT (ip_address) DO UPDATE SET
    failed_attempts = ip_rate_limits.failed_attempts + 1,
    last_attempt_at = now()
  RETURNING * INTO _record;
  
  _new_attempts := _record.failed_attempts;
  
  -- Check if should block
  IF _new_attempts >= _max_attempts THEN
    UPDATE public.ip_rate_limits
    SET is_blocked = true, blocked_until = now() + (_block_minutes || ' minutes')::INTERVAL
    WHERE ip_address = _ip_address;
    
    RETURN QUERY SELECT 
      true::BOOLEAN,
      _new_attempts,
      (_block_minutes * 60)::INTEGER;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    false::BOOLEAN,
    _new_attempts,
    0;
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _email TEXT,
  _event_type TEXT,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Try to find user_id from email
  SELECT id INTO _user_id FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.email = LOWER(_email);
  
  INSERT INTO public.security_audit_log (user_id, email, event_type, ip_address, user_agent, metadata)
  VALUES (_user_id, LOWER(_email), _event_type, _ip_address, _user_agent, _metadata);
END;
$$;

-- Add unique constraint for ip_address upsert
ALTER TABLE public.ip_rate_limits ADD CONSTRAINT ip_rate_limits_ip_unique UNIQUE (ip_address);