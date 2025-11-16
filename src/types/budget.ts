export interface UserBudget {
  id: string;
  user_id: string;
  environment_mode: string;
  monthly_budget: number | null;
  daily_limit: number | null;
  current_spending: number | null;
  alert_threshold: number | null;
  period_start: string | null;
  email_notifications_enabled: boolean | null;
  notification_email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BudgetFormData {
  monthly_budget: string;
  daily_limit: string;
  alert_threshold: string;
  email_notifications_enabled: boolean;
  notification_email: string;
}
