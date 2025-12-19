/**
 * Base service class with common functionality
 * Provides error handling, logging, and retry logic
 */

import { supabase } from '@/integrations/supabase/client';
import { API, ERROR_MESSAGES } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ServiceOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

// ============================================================================
// Error Handling
// ============================================================================

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  static fromError(error: unknown): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ServiceError(error.message);
    }
    
    return new ServiceError(ERROR_MESSAGES.GENERIC);
  }
}

// ============================================================================
// Base Service
// ============================================================================

export abstract class BaseService {
  protected readonly supabase = supabase;

  /**
   * Wraps an async operation with standardized error handling
   */
  protected async execute<T>(
    operation: () => Promise<T>,
    options: ServiceOptions = {}
  ): Promise<ServiceResult<T>> {
    const { retries = 0 } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await operation();
        return { data, error: null, success: true };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }

        // Wait before retrying
        if (attempt < retries) {
          await this.delay(API.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }

    const serviceError = ServiceError.fromError(lastError);
    console.error(`[${this.constructor.name}] Operation failed:`, serviceError);
    
    return {
      data: null,
      error: serviceError.message,
      success: false,
    };
  }

  /**
   * Determines if an error should not be retried
   */
  private isNonRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('not found') ||
        message.includes('validation')
      );
    }
    return false;
  }

  /**
   * Creates a delay promise
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logs debug information in development
   */
  protected debug(message: string, data?: unknown): void {
    if (import.meta.env.DEV) {
      console.log(`[${this.constructor.name}] ${message}`, data ?? '');
    }
  }
}
