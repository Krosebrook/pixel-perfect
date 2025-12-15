-- Enable realtime on deployment tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_incidents;

-- Create deployment_budgets table
CREATE TABLE public.deployment_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_type TEXT NOT NULL CHECK (budget_type IN ('deployment_count', 'deployment_cost')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  limit_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  alert_threshold NUMERIC DEFAULT 0.8,
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now()),
  email_notifications_enabled BOOLEAN DEFAULT true,
  notification_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deployment_alerts table
CREATE TABLE public.deployment_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.deployment_budgets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'critical', 'exceeded')),
  threshold_percentage NUMERIC NOT NULL,
  message TEXT,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT
);

-- Enable RLS
ALTER TABLE public.deployment_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for deployment_budgets (public read, service role write)
CREATE POLICY "Anyone can view deployment budgets" ON public.deployment_budgets
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage deployment budgets" ON public.deployment_budgets
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for deployment_alerts
CREATE POLICY "Anyone can view deployment alerts" ON public.deployment_alerts
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage deployment alerts" ON public.deployment_alerts
  FOR ALL USING (true) WITH CHECK (true);

-- Function to update budget on new deployment
CREATE OR REPLACE FUNCTION public.update_deployment_budget()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  cost_value NUMERIC;
  new_value NUMERIC;
BEGIN
  -- Calculate cost based on deployment status
  cost_value := CASE 
    WHEN NEW.status = 'failed' THEN 10
    WHEN NEW.status = 'rolled_back' THEN 15
    ELSE 1
  END;

  -- Update all active budgets
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

    -- Check thresholds and create alerts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update budget on new deployment
CREATE TRIGGER on_deployment_update_budget
  AFTER INSERT ON public.deployment_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deployment_budget();

-- Function to compare deployment periods
CREATE OR REPLACE FUNCTION public.compare_deployment_periods(
  period1_start TIMESTAMPTZ,
  period1_end TIMESTAMPTZ,
  period2_start TIMESTAMPTZ,
  period2_end TIMESTAMPTZ
)
RETURNS TABLE (
  metric_name TEXT,
  period1_value NUMERIC,
  period2_value NUMERIC,
  change_percentage NUMERIC,
  change_direction TEXT
) AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;