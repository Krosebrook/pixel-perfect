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
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes default
export const SESSION_WARNING_BEFORE_TIMEOUT_MS = 60 * 1000; // 1 minute warning

// Session timeout options for user selection
export const SESSION_TIMEOUT_OPTIONS = [
  { value: 15 * 60 * 1000, label: '15 minutes' },
  { value: 30 * 60 * 1000, label: '30 minutes' },
  { value: 45 * 60 * 1000, label: '45 minutes' },
  { value: 60 * 60 * 1000, label: '1 hour' },
] as const;

// Extended timeout for trusted devices (7 days)
export const TRUSTED_DEVICE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

// Local storage keys
export const STORAGE_KEYS = {
  SESSION_TIMEOUT: 'session_timeout_ms',
  REMEMBER_DEVICE: 'remember_device',
} as const;

// API Configuration
export const API = {
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// UI Configuration
export const UI = {
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_DURATION_MS: 5000,
  ANIMATION_DURATION_MS: 200,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
} as const;

// Query Keys
export const QUERY_KEYS = {
  PROMPTS: 'prompts',
  PROMPT_DETAIL: 'promptDetail',
  PROMPT_VERSIONS: 'promptVersions',
} as const;
