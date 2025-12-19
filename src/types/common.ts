/**
 * Common/shared type definitions used across the application
 * NOTE: Types that duplicate existing domain types are intentionally excluded
 */

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Makes specific keys of T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specific keys of T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Generic async state for data fetching
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Time Range Types
// ============================================================================

export type TimeRangePreset = '24h' | '7d' | '30d' | '90d' | 'custom';

export interface TimeRange {
  preset: TimeRangePreset;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'json' | 'csv' | 'md';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
}

// ============================================================================
// Form State Types
// ============================================================================

export interface FormFieldState<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// Action Result Types
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MutationResult<T = void> extends ActionResult<T> {
  isLoading: boolean;
}

// ============================================================================
// Component Props Base Types
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
}

export interface WithChildren {
  children: React.ReactNode;
}

export interface WithOptionalChildren {
  children?: React.ReactNode;
}
