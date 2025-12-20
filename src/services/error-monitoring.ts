/**
 * Error Monitoring Service using Sentry
 * Provides centralized error tracking and reporting
 */

let Sentry: typeof import('@sentry/react') | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Load Sentry lazily to avoid React hook conflicts
 */
async function loadSentry(): Promise<typeof import('@sentry/react') | null> {
  if (Sentry) return Sentry;
  
  try {
    Sentry = await import('@sentry/react');
    return Sentry;
  } catch (error) {
    console.warn('Failed to load Sentry:', error);
    return null;
  }
}

/**
 * Initialize Sentry error monitoring (call after React is mounted)
 */
export async function initErrorMonitoring(): Promise<void> {
  if (isInitialized || initPromise) {
    return initPromise || Promise.resolve();
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  initPromise = (async () => {
    const sentryModule = await loadSentry();
    if (!sentryModule) return;

    sentryModule.init({
      dsn,
      environment: import.meta.env.MODE,
      enabled: import.meta.env.PROD,
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
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
  })();

  return initPromise;
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

  if (Sentry && isInitialized) {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  } else {
    // Fallback to console in case Sentry isn't ready
    console.error('Error (Sentry not ready):', error, context);
  }
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

  if (Sentry && isInitialized) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (Sentry && isInitialized) {
    Sentry.setUser(user);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  if (Sentry && isInitialized) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Set extra context
 */
export function setContext(name: string, data: Record<string, unknown>): void {
  if (Sentry && isInitialized) {
    Sentry.setContext(name, data);
  }
}

/**
 * Set a tag for filtering
 */
export function setTag(key: string, value: string): void {
  if (Sentry && isInitialized) {
    Sentry.setTag(key, value);
  }
}
