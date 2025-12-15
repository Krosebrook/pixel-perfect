export interface DeploymentMetric {
  id: string;
  deployment_type: string;
  commit_sha: string;
  workflow_run_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  status: string;
  health_check_status: string | null;
  deployment_url: string | null;
  error_message: string | null;
  created_at: string;
}

export interface DeploymentIncident {
  id: string;
  deployment_id: string;
  incident_type: string;
  severity: string;
  failed_checks: string[] | null;
  github_issue_number: number | null;
  github_issue_url: string | null;
  detected_at: string;
  resolved_at: string | null;
  resolution_time_minutes: number | null;
  resolution_notes: string | null;
  deployment_metrics?: DeploymentMetric;
}

export interface DeploymentBudget {
  id: string;
  budget_type: 'deployment_count' | 'deployment_cost';
  period: 'daily' | 'weekly' | 'monthly';
  limit_value: number;
  current_value: number;
  alert_threshold: number;
  period_start: string;
  email_notifications_enabled: boolean;
  notification_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentAlert {
  id: string;
  budget_id: string;
  alert_type: 'warning' | 'critical' | 'exceeded';
  threshold_percentage: number;
  message: string | null;
  triggered_at: string;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export interface PeriodComparison {
  metric_name: string;
  period1_value: number;
  period2_value: number;
  change_percentage: number;
  change_direction: 'up' | 'down' | 'same';
}

export interface DeploymentComparison {
  deployment1: DeploymentMetric;
  deployment2: DeploymentMetric;
  differences: {
    duration_delta: number;
    status_changed: boolean;
    health_status_changed: boolean;
  };
}
