-- Update get_rate_limit_config function to include manage-team and manage-api-keys endpoints
CREATE OR REPLACE FUNCTION public.get_rate_limit_config(_environment_mode text)
RETURNS TABLE(endpoint_name text, max_calls_per_minute integer, max_calls_per_hour integer, max_calls_per_day integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _environment_mode = 'sandbox' THEN
    RETURN QUERY SELECT * FROM (VALUES
      ('run-comparison', 5, 50, 100),
      ('generate-insights', 3, 30, 50),
      ('generate-prompt', 10, 100, 200),
      ('optimize-prompt', 5, 50, 100),
      ('validate-quality', 10, 100, 200),
      ('apply-template', 20, 200, 500),
      ('run-comparison-stream', 3, 30, 50),
      ('manage-team', 30, 200, 1000),
      ('manage-api-keys', 20, 100, 500)
    ) AS limits(endpoint_name, max_calls_per_minute, max_calls_per_hour, max_calls_per_day);
  ELSE
    RETURN QUERY SELECT * FROM (VALUES
      ('run-comparison', 60, 1000, 5000),
      ('generate-insights', 30, 500, 2000),
      ('generate-prompt', 100, 2000, 10000),
      ('optimize-prompt', 60, 1000, 5000),
      ('validate-quality', 100, 2000, 10000),
      ('apply-template', 200, 4000, 20000),
      ('run-comparison-stream', 30, 500, 2000),
      ('manage-team', 60, 500, 2000),
      ('manage-api-keys', 60, 300, 1500)
    ) AS limits(endpoint_name, max_calls_per_minute, max_calls_per_hour, max_calls_per_day);
  END IF;
END;
$function$;