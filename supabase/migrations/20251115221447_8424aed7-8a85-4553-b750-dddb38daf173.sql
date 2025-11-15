-- Phase 1: Developer Sandbox Database Infrastructure

-- 1. Add environment mode to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS environment_mode text DEFAULT 'production' 
CHECK (environment_mode IN ('sandbox', 'production'));

CREATE INDEX IF NOT EXISTS idx_profiles_environment_mode ON public.profiles(environment_mode);

-- 2. Create API rate limits tracking table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint_name text NOT NULL,
  calls_count integer DEFAULT 0,
  window_start timestamp with time zone DEFAULT now(),
  environment_mode text NOT NULL CHECK (environment_mode IN ('sandbox', 'production')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, endpoint_name, window_start, environment_mode)
);

-- Enable RLS on api_rate_limits
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage rate limits (from edge functions)
CREATE POLICY "Service role can manage rate limits"
  ON public.api_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Update user_budgets for sandbox support
ALTER TABLE public.user_budgets
ADD COLUMN IF NOT EXISTS environment_mode text DEFAULT 'production' 
CHECK (environment_mode IN ('sandbox', 'production'));

ALTER TABLE public.user_budgets
ADD COLUMN IF NOT EXISTS daily_limit numeric DEFAULT NULL;

-- Drop old unique constraint if exists
ALTER TABLE public.user_budgets 
DROP CONSTRAINT IF EXISTS user_budgets_user_id_period_start_key;

-- Add new unique constraint including environment_mode
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_budgets_user_env_period_unique'
  ) THEN
    ALTER TABLE public.user_budgets
    ADD CONSTRAINT user_budgets_user_env_period_unique 
    UNIQUE(user_id, period_start, environment_mode);
  END IF;
END $$;

-- Create default sandbox budgets for existing users
INSERT INTO public.user_budgets (user_id, environment_mode, monthly_budget, daily_limit, current_spending, period_start)
SELECT 
  id,
  'sandbox',
  10.00,
  1.00,
  0.00,
  date_trunc('month', now())
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_budgets 
  WHERE user_id = profiles.id AND environment_mode = 'sandbox'
);

-- 4. Create rate limit configuration function
CREATE OR REPLACE FUNCTION public.get_rate_limit_config(
  _environment_mode text
) RETURNS TABLE(
  endpoint_name text,
  max_calls_per_minute integer,
  max_calls_per_hour integer,
  max_calls_per_day integer
) AS $$
BEGIN
  IF _environment_mode = 'sandbox' THEN
    RETURN QUERY SELECT * FROM (VALUES
      ('run-comparison', 5, 50, 100),
      ('generate-insights', 3, 30, 50),
      ('generate-prompt', 10, 100, 200),
      ('optimize-prompt', 5, 50, 100),
      ('validate-quality', 10, 100, 200),
      ('apply-template', 20, 200, 500),
      ('run-comparison-stream', 3, 30, 50)
    ) AS limits(endpoint_name, max_calls_per_minute, max_calls_per_hour, max_calls_per_day);
  ELSE
    -- Production limits (much higher)
    RETURN QUERY SELECT * FROM (VALUES
      ('run-comparison', 60, 1000, 5000),
      ('generate-insights', 30, 500, 2000),
      ('generate-prompt', 100, 2000, 10000),
      ('optimize-prompt', 60, 1000, 5000),
      ('validate-quality', 100, 2000, 10000),
      ('apply-template', 200, 4000, 20000),
      ('run-comparison-stream', 30, 500, 2000)
    ) AS limits(endpoint_name, max_calls_per_minute, max_calls_per_hour, max_calls_per_day);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Create helper function to increment rate limit counters
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  _user_id uuid,
  _endpoint_name text,
  _window_start timestamp with time zone,
  _environment_mode text
) RETURNS void AS $$
BEGIN
  INSERT INTO public.api_rate_limits (user_id, endpoint_name, calls_count, window_start, environment_mode)
  VALUES (_user_id, _endpoint_name, 1, _window_start, _environment_mode)
  ON CONFLICT (user_id, endpoint_name, window_start, environment_mode)
  DO UPDATE SET calls_count = api_rate_limits.calls_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get current API usage
CREATE OR REPLACE FUNCTION public.get_api_usage(
  _user_id uuid,
  _environment_mode text,
  _time_range interval DEFAULT '24 hours'
) RETURNS TABLE(
  endpoint_name text,
  total_calls bigint,
  last_call timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    api_rate_limits.endpoint_name,
    SUM(api_rate_limits.calls_count)::bigint as total_calls,
    MAX(api_rate_limits.window_start) as last_call
  FROM public.api_rate_limits
  WHERE api_rate_limits.user_id = _user_id
    AND api_rate_limits.environment_mode = _environment_mode
    AND api_rate_limits.window_start >= now() - _time_range
  GROUP BY api_rate_limits.endpoint_name
  ORDER BY total_calls DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;