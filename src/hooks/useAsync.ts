/**
 * useAsync Hook
 * Handles async operations with loading, error, and data states
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AsyncState } from '@/types/common';

interface UseAsyncOptions {
  /** Execute immediately on mount */
  immediate?: boolean;
  /** Callback on success */
  onSuccess?: (data: unknown) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  /** Execute the async function */
  execute: (...args: unknown[]) => Promise<T | null>;
  /** Reset state to initial values */
  reset: () => void;
  /** Whether the operation has been executed at least once */
  hasExecuted: boolean;
}

/**
 * Hook for managing async operations with proper state handling
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(
 *   () => fetchUserData(userId),
 *   { immediate: true }
 * );
 * ```
 */
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  });

  const [hasExecuted, setHasExecuted] = useState(false);
  
  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  const asyncFunctionRef = useRef(asyncFunction);

  // Update ref when function changes
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
  }, [asyncFunction]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    if (!mountedRef.current) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setHasExecuted(true);

    try {
      const result = await asyncFunctionRef.current(...args);
      
      if (mountedRef.current) {
        setState({ data: result, isLoading: false, error: null });
        onSuccess?.(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (mountedRef.current) {
        setState({ data: null, isLoading: false, error });
        onError?.(error);
      }
      
      return null;
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
    setHasExecuted(false);
  }, []);

  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
    hasExecuted,
  };
}

export default useAsync;
