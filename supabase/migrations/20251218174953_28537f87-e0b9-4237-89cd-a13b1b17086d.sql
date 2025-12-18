-- Fix update_incident_resolution_time
CREATE OR REPLACE FUNCTION public.update_incident_resolution_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    NEW.resolution_time_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.detected_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix get_deployment_statistics
CREATE OR REPLACE FUNCTION public.get_deployment_statistics(days_back integer DEFAULT 30)
RETURNS TABLE(total_deployments bigint, successful_deployments bigint, failed_deployments bigint, rollback_count bigint, success_rate numeric, avg_deployment_duration_seconds numeric, total_incidents bigint, resolved_incidents bigint, avg_resolution_time_minutes numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH deployment_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'success') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'rolled_back') as rolled_back,
      AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL) as avg_duration
    FROM public.deployment_metrics
    WHERE started_at >= NOW() - (days_back || ' days')::INTERVAL
      AND deployment_type = 'production'
  ),
  incident_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved,
      AVG(resolution_time_minutes) FILTER (WHERE resolution_time_minutes IS NOT NULL) as avg_resolution
    FROM public.deployment_incidents
    WHERE detected_at >= NOW() - (days_back || ' days')::INTERVAL
  )
  SELECT
    d.total,
    d.successful,
    d.failed,
    d.rolled_back,
    CASE 
      WHEN d.total > 0 THEN ROUND((d.successful::NUMERIC / d.total::NUMERIC) * 100, 2)
      ELSE 0
    END as success_rate,
    ROUND(d.avg_duration, 2),
    i.total,
    i.resolved,
    ROUND(i.avg_resolution, 2)
  FROM deployment_stats d, incident_stats i;
END;
$$;

-- Fix update_deployment_budget
CREATE OR REPLACE FUNCTION public.update_deployment_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  budget_record RECORD;
  cost_value NUMERIC;
  new_value NUMERIC;
BEGIN
  cost_value := CASE 
    WHEN NEW.status = 'failed' THEN 10
    WHEN NEW.status = 'rolled_back' THEN 15
    ELSE 1
  END;

  FOR budget_record IN 
    SELECT * FROM public.deployment_budgets 
    WHERE (
      (period = 'daily' AND period_start >= date_trunc('day', now())) OR
      (period = 'weekly' AND period_start >= date_trunc('week', now())) OR
      (period = 'monthly' AND period_start >= date_trunc('month', now()))
    )
  LOOP
    IF budget_record.budget_type = 'deployment_count' THEN
      new_value := budget_record.current_value + 1;
    ELSE
      new_value := budget_record.current_value + cost_value;
    END IF;

    UPDATE public.deployment_budgets 
    SET current_value = new_value, updated_at = now()
    WHERE id = budget_record.id;

    IF new_value >= budget_record.limit_value THEN
      INSERT INTO public.deployment_alerts (budget_id, alert_type, threshold_percentage, message)
      VALUES (budget_record.id, 'exceeded', 100, 'Budget limit exceeded');
    ELSIF new_value >= budget_record.limit_value * 0.9 THEN
      INSERT INTO public.deployment_alerts (budget_id, alert_type, threshold_percentage, message)
      VALUES (budget_record.id, 'critical', 90, 'Budget at 90% capacity');
    ELSIF new_value >= budget_record.limit_value * budget_record.alert_threshold THEN
      INSERT INTO public.deployment_alerts (budget_id, alert_type, threshold_percentage, message)
      VALUES (budget_record.id, 'warning', budget_record.alert_threshold * 100, 'Budget threshold reached');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Fix compare_deployment_periods
CREATE OR REPLACE FUNCTION public.compare_deployment_periods(period1_start timestamp with time zone, period1_end timestamp with time zone, period2_start timestamp with time zone, period2_end timestamp with time zone)
RETURNS TABLE(metric_name text, period1_value numeric, period2_value numeric, change_percentage numeric, change_direction text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH period1_stats AS (
    SELECT
      COUNT(*)::NUMERIC as total,
      COUNT(*) FILTER (WHERE status = 'success')::NUMERIC as successful,
      COUNT(*) FILTER (WHERE status = 'rolled_back')::NUMERIC as rollbacks,
      AVG(duration_seconds)::NUMERIC as avg_duration
    FROM public.deployment_metrics
    WHERE started_at >= period1_start AND started_at < period1_end
      AND deployment_type = 'production'
  ),
  period2_stats AS (
    SELECT
      COUNT(*)::NUMERIC as total,
      COUNT(*) FILTER (WHERE status = 'success')::NUMERIC as successful,
      COUNT(*) FILTER (WHERE status = 'rolled_back')::NUMERIC as rollbacks,
      AVG(duration_seconds)::NUMERIC as avg_duration
    FROM public.deployment_metrics
    WHERE started_at >= period2_start AND started_at < period2_end
      AND deployment_type = 'production'
  ),
  period1_incidents AS (
    SELECT COUNT(*)::NUMERIC as total,
           COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::NUMERIC as resolved,
           AVG(resolution_time_minutes)::NUMERIC as avg_resolution
    FROM public.deployment_incidents
    WHERE detected_at >= period1_start AND detected_at < period1_end
  ),
  period2_incidents AS (
    SELECT COUNT(*)::NUMERIC as total,
           COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::NUMERIC as resolved,
           AVG(resolution_time_minutes)::NUMERIC as avg_resolution
    FROM public.deployment_incidents
    WHERE detected_at >= period2_start AND detected_at < period2_end
  )
  SELECT 'Total Deployments'::TEXT, p1.total, p2.total,
         CASE WHEN p1.total > 0 THEN ROUND(((p2.total - p1.total) / p1.total) * 100, 2) ELSE 0 END,
         CASE WHEN p2.total > p1.total THEN 'up' WHEN p2.total < p1.total THEN 'down' ELSE 'same' END
  FROM period1_stats p1, period2_stats p2
  UNION ALL
  SELECT 'Success Rate'::TEXT, 
         CASE WHEN p1.total > 0 THEN ROUND((p1.successful / p1.total) * 100, 2) ELSE 0 END,
         CASE WHEN p2.total > 0 THEN ROUND((p2.successful / p2.total) * 100, 2) ELSE 0 END,
         CASE WHEN p1.total > 0 AND p2.total > 0 THEN 
           ROUND((p2.successful / p2.total) * 100 - (p1.successful / p1.total) * 100, 2) 
         ELSE 0 END,
         CASE 
           WHEN p2.total > 0 AND p1.total > 0 AND (p2.successful / p2.total) > (p1.successful / p1.total) THEN 'up'
           WHEN p2.total > 0 AND p1.total > 0 AND (p2.successful / p2.total) < (p1.successful / p1.total) THEN 'down'
           ELSE 'same'
         END
  FROM period1_stats p1, period2_stats p2
  UNION ALL
  SELECT 'Rollbacks'::TEXT, p1.rollbacks, p2.rollbacks,
         CASE WHEN p1.rollbacks > 0 THEN ROUND(((p2.rollbacks - p1.rollbacks) / p1.rollbacks) * 100, 2) ELSE 0 END,
         CASE WHEN p2.rollbacks > p1.rollbacks THEN 'up' WHEN p2.rollbacks < p1.rollbacks THEN 'down' ELSE 'same' END
  FROM period1_stats p1, period2_stats p2
  UNION ALL
  SELECT 'Avg Duration (s)'::TEXT, ROUND(COALESCE(p1.avg_duration, 0), 2), ROUND(COALESCE(p2.avg_duration, 0), 2),
         CASE WHEN p1.avg_duration > 0 THEN ROUND(((p2.avg_duration - p1.avg_duration) / p1.avg_duration) * 100, 2) ELSE 0 END,
         CASE WHEN p2.avg_duration > p1.avg_duration THEN 'up' WHEN p2.avg_duration < p1.avg_duration THEN 'down' ELSE 'same' END
  FROM period1_stats p1, period2_stats p2
  UNION ALL
  SELECT 'Total Incidents'::TEXT, i1.total, i2.total,
         CASE WHEN i1.total > 0 THEN ROUND(((i2.total - i1.total) / i1.total) * 100, 2) ELSE 0 END,
         CASE WHEN i2.total > i1.total THEN 'up' WHEN i2.total < i1.total THEN 'down' ELSE 'same' END
  FROM period1_incidents i1, period2_incidents i2
  UNION ALL
  SELECT 'Avg Resolution (min)'::TEXT, ROUND(COALESCE(i1.avg_resolution, 0), 2), ROUND(COALESCE(i2.avg_resolution, 0), 2),
         CASE WHEN i1.avg_resolution > 0 THEN ROUND(((i2.avg_resolution - i1.avg_resolution) / i1.avg_resolution) * 100, 2) ELSE 0 END,
         CASE WHEN i2.avg_resolution > i1.avg_resolution THEN 'up' WHEN i2.avg_resolution < i1.avg_resolution THEN 'down' ELSE 'same' END
  FROM period1_incidents i1, period2_incidents i2;
END;
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix get_model_leaderboard
CREATE OR REPLACE FUNCTION public.get_model_leaderboard(time_range_days integer DEFAULT 30, category_filter text DEFAULT NULL::text)
RETURNS TABLE(model_name text, avg_latency_ms numeric, avg_cost numeric, total_usage bigint, success_rate numeric, cost_efficiency_score numeric)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH model_stats AS (
    SELECT 
      unnest(mtr.models) as model,
      mtr.total_latency_ms,
      mtr.total_cost,
      mtr.responses,
      mtr.created_at
    FROM public.model_test_runs mtr
    WHERE mtr.created_at >= now() - (time_range_days || ' days')::interval
  ),
  aggregated_stats AS (
    SELECT
      ms.model,
      AVG(ms.total_latency_ms)::numeric as avg_latency,
      AVG(ms.total_cost)::numeric as avg_cost,
      COUNT(*) as usage_count,
      COUNT(*) FILTER (WHERE ms.responses IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as success_rate
    FROM model_stats ms
    GROUP BY ms.model
  )
  SELECT
    a.model as model_name,
    ROUND(a.avg_latency, 2) as avg_latency_ms,
    ROUND(a.avg_cost, 4) as avg_cost,
    a.usage_count as total_usage,
    ROUND(a.success_rate, 2) as success_rate,
    ROUND((a.success_rate / NULLIF(a.avg_cost, 0)), 2) as cost_efficiency_score
  FROM aggregated_stats a
  ORDER BY cost_efficiency_score DESC NULLS LAST;
END;
$$;

-- Fix get_rate_limit_config
CREATE OR REPLACE FUNCTION public.get_rate_limit_config(_environment_mode text)
RETURNS TABLE(endpoint_name text, max_calls_per_minute integer, max_calls_per_hour integer, max_calls_per_day integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix increment_rate_limit
CREATE OR REPLACE FUNCTION public.increment_rate_limit(_user_id uuid, _endpoint_name text, _window_start timestamp with time zone, _environment_mode text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.api_rate_limits (user_id, endpoint_name, calls_count, window_start, environment_mode)
  VALUES (_user_id, _endpoint_name, 1, _window_start, _environment_mode)
  ON CONFLICT (user_id, endpoint_name, window_start, environment_mode)
  DO UPDATE SET calls_count = api_rate_limits.calls_count + 1;
END;
$$;

-- Fix get_api_usage
CREATE OR REPLACE FUNCTION public.get_api_usage(_user_id uuid, _environment_mode text, _time_range interval DEFAULT '24:00:00'::interval)
RETURNS TABLE(endpoint_name text, total_calls bigint, last_call timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix validate_api_key
CREATE OR REPLACE FUNCTION public.validate_api_key(_key_hash text, _endpoint_name text)
RETURNS TABLE(user_id uuid, environment_mode text, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.user_id,
    ak.environment_mode,
    (ak.is_active AND 
     (ak.expires_at IS NULL OR ak.expires_at > now()) AND
     _endpoint_name = ANY(ak.scopes)) as is_valid
  FROM public.api_keys ak
  WHERE ak.key_hash = _key_hash;
  
  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE key_hash = _key_hash;
END;
$$;