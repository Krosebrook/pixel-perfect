export const TIME_RANGES = {
  SEVEN_DAYS: '7',
  THIRTY_DAYS: '30',
  SIXTY_DAYS: '60',
  NINETY_DAYS: '90',
} as const;

export const TIME_RANGE_LABELS = {
  [TIME_RANGES.SEVEN_DAYS]: 'Last 7 Days',
  [TIME_RANGES.THIRTY_DAYS]: 'Last 30 Days',
  [TIME_RANGES.SIXTY_DAYS]: 'Last 60 Days',
  [TIME_RANGES.NINETY_DAYS]: 'Last 90 Days',
} as const;

export const ENVIRONMENT_MODES = {
  SANDBOX: 'sandbox',
  PRODUCTION: 'production',
} as const;

export const DEFAULT_ALERT_THRESHOLD = 0.8;
export const DEFAULT_MONTHLY_BUDGET = 100;

export const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
] as const;

export const REFETCH_INTERVALS = {
  FAST: 5000,
  NORMAL: 10000,
  SLOW: 30000,
} as const;

// Session timeout configuration (in milliseconds)
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const SESSION_WARNING_BEFORE_TIMEOUT_MS = 60 * 1000; // 1 minute warning
