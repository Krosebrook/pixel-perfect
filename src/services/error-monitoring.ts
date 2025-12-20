/**
 * Error Monitoring Service using Sentry
 * Provides centralized error tracking and reporting
 */

import * as Sentry from '@sentry/react';

let isInitialized = false;

/**
 * Initialize Sentry error monitoring
 */
export function initErrorMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  if (isInitialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out certain errors
      const error = hint.originalException;
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Skip common user-caused errors
        if (
          message.includes('network') ||
          message.includes('fetch failed') ||
          message.includes('401') ||
          message.includes('404')
        ) {
          return null;
        }
      }
      return event;
    },
  });

  isInitialized = true;
  console.log('Sentry error monitoring initialized');
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (!import.meta.env.PROD) {
    console.error('Development error:', error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Capture a message and send to Sentry
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (!import.meta.env.PROD) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Set extra context
 */
export function setContext(name: string, data: Record<string, unknown>): void {
  Sentry.setContext(name, data);
}

/**
 * Set a tag for filtering
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}
