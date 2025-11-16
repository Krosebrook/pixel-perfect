export interface ApiUsageData {
  endpoint_name: string;
  total_calls: number;
  last_call: string;
}

export interface RateLimitConfig {
  endpoint_name: string;
  max_calls_per_minute: number;
  max_calls_per_hour: number;
  max_calls_per_day: number;
}

export interface RateLimitUsage {
  endpoint: string;
  minute: TimeWindowUsage;
  hour: TimeWindowUsage;
  day: TimeWindowUsage;
}

export interface TimeWindowUsage {
  used: number;
  limit: number;
  resetIn: number;
}

export interface ModelTestRun {
  id: string;
  user_id: string;
  prompt_text: string;
  models: string[];
  responses: any;
  total_cost: number | null;
  total_latency_ms: number | null;
  created_at: string;
  team_id: string | null;
}
