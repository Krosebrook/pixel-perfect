/**
 * Tests for useAsync hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAsync } from '../useAsync';

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have initial state with no data, not loading, and no error', () => {
      const asyncFn = vi.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasExecuted).toBe(false);
    });

    it('should start loading when immediate is true', () => {
      const asyncFn = vi.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn, { immediate: true }));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('execute', () => {
    it('should set loading state and return data on success', async () => {
      const mockData = { id: 1, name: 'Test' };
      const asyncFn = vi.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() => useAsync(asyncFn));

      let executeResult: unknown = null;
      await act(async () => {
        executeResult = await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasExecuted).toBe(true);
      expect(executeResult).toEqual(mockData);
    });

    it('should pass arguments to the async function', async () => {
      const asyncFn = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute('arg1', 'arg2');
      });

      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle errors and set error state', async () => {
      const errorMessage = 'Test error';
      const asyncFn = vi.fn().mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.hasExecuted).toBe(true);
    });

    it('should convert non-Error throws to Error objects', async () => {
      const asyncFn = vi.fn().mockRejectedValue('string error');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback when operation succeeds', async () => {
      const mockData = { success: true };
      const asyncFn = vi.fn().mockResolvedValue(mockData);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useAsync(asyncFn, { onSuccess }));

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });

    it('should call onError callback when operation fails', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() => useAsync(asyncFn, { onError }));

      await act(async () => {
        await result.current.execute();
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const asyncFn = vi.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));

      // First execute
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('data');
      expect(result.current.hasExecuted).toBe(true);

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasExecuted).toBe(false);
    });
  });

  describe('immediate execution', () => {
    it('should execute immediately when immediate option is true', async () => {
      const mockData = 'immediate data';
      const asyncFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useAsync(asyncFn, { immediate: true }));

      await waitFor(() => {
        expect(result.current.data).toBe(mockData);
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('function reference updates', () => {
    it('should use the latest function reference', async () => {
      const firstFn = vi.fn().mockResolvedValue('first');
      const secondFn = vi.fn().mockResolvedValue('second');

      const { result, rerender } = renderHook(
        ({ fn }) => useAsync(fn),
        { initialProps: { fn: firstFn } }
      );

      // Update the function
      rerender({ fn: secondFn });

      // Execute should use the new function
      await act(async () => {
        await result.current.execute();
      });

      expect(secondFn).toHaveBeenCalled();
      expect(result.current.data).toBe('second');
    });
  });
});
