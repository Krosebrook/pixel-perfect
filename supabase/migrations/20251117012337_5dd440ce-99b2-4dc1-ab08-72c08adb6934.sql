-- Create deployment_metrics table to track all deployments
CREATE TABLE public.deployment_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('production', 'preview')),
  commit_sha TEXT NOT NULL,
  workflow_run_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'rolled_back')),
  health_check_status TEXT CHECK (health_check_status IN ('healthy', 'unhealthy', 'skipped')),
  deployment_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deployment_incidents table to track incidents and resolution
CREATE TABLE public.deployment_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployment_id UUID NOT NULL REFERENCES public.deployment_metrics(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('health_check_failure', 'deployment_failure', 'rollback_failure')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'high',
  failed_checks TEXT[],
  github_issue_number INTEGER,
  github_issue_url TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_time_minutes INTEGER,
  resolution_notes TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_deployment_metrics_type_status ON public.deployment_metrics(deployment_type, status);
CREATE INDEX idx_deployment_metrics_started_at ON public.deployment_metrics(started_at DESC);
CREATE INDEX idx_deployment_incidents_detected_at ON public.deployment_incidents(detected_at DESC);
CREATE INDEX idx_deployment_incidents_resolved ON public.deployment_incidents(resolved_at) WHERE resolved_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.deployment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_incidents ENABLE ROW LEVEL SECURITY;

-- Create policies for deployment_metrics (read-only for authenticated users)
CREATE POLICY "Anyone can view deployment metrics"
  ON public.deployment_metrics
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert deployment metrics"
  ON public.deployment_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update deployment metrics"
  ON public.deployment_metrics
  FOR UPDATE
  USING (true);

-- Create policies for deployment_incidents (read-only for authenticated users)
CREATE POLICY "Anyone can view deployment incidents"
  ON public.deployment_incidents
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert deployment incidents"
  ON public.deployment_incidents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update deployment incidents"
  ON public.deployment_incidents
  FOR UPDATE
  USING (true);

-- Create function to calculate resolution time
CREATE OR REPLACE FUNCTION public.update_incident_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    NEW.resolution_time_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.detected_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic resolution time calculation
CREATE TRIGGER calculate_incident_resolution_time
  BEFORE UPDATE ON public.deployment_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_incident_resolution_time();

-- Create function to get deployment statistics
CREATE OR REPLACE FUNCTION public.get_deployment_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_deployments BIGINT,
  successful_deployments BIGINT,
  failed_deployments BIGINT,
  rollback_count BIGINT,
  success_rate NUMERIC,
  avg_deployment_duration_seconds NUMERIC,
  total_incidents BIGINT,
  resolved_incidents BIGINT,
  avg_resolution_time_minutes NUMERIC
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;