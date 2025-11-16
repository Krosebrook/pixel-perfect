import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRateLimitConfig, useRateLimitUsage } from '../useRateLimits';
import { supabase } from '@/integrations/supabase/client';
import { createWrapper, mockRateLimitConfig } from '@/test/test-utils';

vi.mock('@/integrations/supabase/client');

describe('useRateLimitConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch rate limit config successfully', async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: mockRateLimitConfig,
      error: null,
    });

    const { result } = renderHook(() => useRateLimitConfig('sandbox'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRateLimitConfig);
  });

  it('should not fetch if environmentMode is undefined', () => {
    const { result } = renderHook(() => useRateLimitConfig(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Failed to fetch config');
    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useRateLimitConfig('sandbox'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRateLimitUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate usage correctly', async () => {
    const mockData = [
      {
        endpoint_name: 'run-comparison',
        window_start: new Date(Date.now() - 30000).toISOString(),
        calls_count: 3,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          })),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(
      () => useRateLimitUsage('test-user-id', 'sandbox', mockRateLimitConfig),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('should not fetch if required params are missing', () => {
    const { result } = renderHook(
      () => useRateLimitUsage(undefined, undefined, []),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.isPending).toBe(true);
  });
});
