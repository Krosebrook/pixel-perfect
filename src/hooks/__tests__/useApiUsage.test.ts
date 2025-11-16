import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@/test/test-utils';
import { useApiUsage } from '../useApiUsage';
import { supabase } from '@/integrations/supabase/client';
import { createWrapper } from '@/test/test-utils';

vi.mock('@/integrations/supabase/client');

describe('useApiUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch API usage successfully', async () => {
    const mockData = [
      { endpoint_name: 'run-comparison', total_calls: 150, last_call: new Date().toISOString() },
      { endpoint_name: 'generate-prompt', total_calls: 89, last_call: new Date().toISOString() },
    ];

    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(
      () => useApiUsage('test-user-id', 'sandbox', '24 hours'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('should not fetch if userId or environmentMode is undefined', () => {
    const { result } = renderHook(() => useApiUsage(undefined, undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Failed to fetch usage');
    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(
      () => useApiUsage('test-user-id', 'sandbox'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
