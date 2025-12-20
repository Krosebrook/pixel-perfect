/**
 * Utility functions for error handling and reporting
 */

import { captureException as sentryCaptureException, setContext } from '@/services/error-monitoring';

export interface ErrorContext {
  userId?: string;
  route?: string;
  timestamp: string;
  userAgent: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Log error to monitoring service using Sentry
 */
export function logErrorToService(
  error: Error,
  context: Partial<ErrorContext> = {}
): void {
  const errorContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    route: window.location.pathname,
    ...context,
  };

  if (import.meta.env.PROD) {
    // Set context for better debugging
    setContext('errorContext', errorContext as unknown as Record<string, unknown>);
    
    // Send to Sentry
    sentryCaptureException(error, {
      timestamp: errorContext.timestamp,
      userAgent: errorContext.userAgent,
      route: errorContext.route,
      userId: errorContext.userId,
      additionalInfo: context.additionalInfo,
    });
  } else {
    // In development, just log to console
    console.error('Development error:', error, errorContext);
  }
}

/**
 * Convert technical error messages to user-friendly messages
 */
export function getUserFriendlyMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch failed')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (
    lowerMessage.includes('auth') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('401')
  ) {
    return 'Authentication error. Please sign in again to continue.';
  }

  // Rate limiting
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'The request took too long. Please try again.';
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Invalid input. Please check your data and try again.';
  }

  // Not found
  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return 'The requested resource was not found.';
  }

  // Server errors
  if (lowerMessage.includes('500') || lowerMessage.includes('server error')) {
    return 'A server error occurred. Our team has been notified.';
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Determine if an error should be reported to the monitoring service
 */
export function shouldReportError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Don't report user-caused errors
  const userErrors = [
    'validation',
    'invalid input',
    'not found',
    '404',
    'unauthorized',
    '401',
  ];

  if (userErrors.some((term) => message.includes(term))) {
    return false;
  }

  // Don't report network errors (usually temporary)
  if (message.includes('network') || message.includes('fetch failed')) {
    return false;
  }

  // Report everything else
  return true;
}

/**
 * Get current context for error reporting
 */
export function getErrorContext(
  additionalInfo?: Record<string, any>
): ErrorContext {
  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    route: window.location.pathname,
    additionalInfo,
  };
}

/**
 * Retry a promise-based function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
