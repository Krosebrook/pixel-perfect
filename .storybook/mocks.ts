import type { UserProfile } from '@/types/profile';
import type { UserBudget } from '@/types/budget';
import type { ApiUsageData, RateLimitConfig, RateLimitUsage } from '@/types/api';

export const mockUser: UserProfile = {
  id: 'mock-user-id',
  display_name: 'John Doe',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  bio: 'Full-stack developer passionate about AI and prompt engineering',
  environment_mode: 'sandbox',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockBudget: UserBudget = {
  id: 'mock-budget-id',
  user_id: 'mock-user-id',
  environment_mode: 'sandbox',
  monthly_budget: 100,
  daily_limit: 10,
  current_spending: 45.75,
  alert_threshold: 0.8,
  email_notifications_enabled: true,
  notification_email: 'john@example.com',
  period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockApiUsage: ApiUsageData[] = [
  {
    endpoint_name: 'run-comparison',
    total_calls: 150,
    last_call: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    endpoint_name: 'generate-prompt',
    total_calls: 89,
    last_call: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    endpoint_name: 'optimize-prompt',
    total_calls: 45,
    last_call: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockRateLimits: RateLimitConfig[] = [
  {
    endpoint_name: 'run-comparison',
    max_calls_per_minute: 10,
    max_calls_per_hour: 100,
    max_calls_per_day: 1000,
  },
  {
    endpoint_name: 'generate-prompt',
    max_calls_per_minute: 5,
    max_calls_per_hour: 50,
    max_calls_per_day: 500,
  },
];

export const mockRateLimitUsage: RateLimitUsage[] = [
  {
    endpoint_name: 'run-comparison',
    per_minute: {
      used: 3,
      limit: 10,
      remaining: 7,
      reset_at: new Date(Date.now() + 45000),
    },
    per_hour: {
      used: 67,
      limit: 100,
      remaining: 33,
      reset_at: new Date(Date.now() + 1800000),
    },
    per_day: {
      used: 425,
      limit: 1000,
      remaining: 575,
      reset_at: new Date(Date.now() + 28800000),
    },
  },
];
