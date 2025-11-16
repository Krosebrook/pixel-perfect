import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@/test/test-utils';
import { useBudget, useUpdateBudget } from '../useBudget';
import { supabase } from '@/integrations/supabase/client';
import { createWrapper, mockUserBudget } from '@/test/test-utils';
import { toast } from 'sonner';

vi.mock('@/integrations/supabase/client');
vi.mock('sonner');

describe('useBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch budget successfully', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockUserBudget, error: null }),
          })),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(
      () => useBudget('test-user-id', 'sandbox'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUserBudget);
  });

  it('should return null when no budget exists', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(
      () => useBudget('test-user-id', 'sandbox'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should not fetch if userId or environmentMode is undefined', () => {
    const { result } = renderHook(() => useBudget(undefined, undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });
});

describe('useUpdateBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update budget successfully', async () => {
    const mockFrom = vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useUpdateBudget(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      user_id: 'test-user-id',
      environment_mode: 'sandbox',
      monthly_budget: 150,
    });

    expect(toast.success).toHaveBeenCalledWith('Settings saved successfully');
  });

  it('should handle update errors', async () => {
    const mockError = new Error('Update failed');
    const mockFrom = vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: mockError }),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useUpdateBudget(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        user_id: 'test-user-id',
        environment_mode: 'sandbox',
        monthly_budget: 150,
      })
    ).rejects.toThrow('Update failed');

    expect(toast.error).toHaveBeenCalled();
  });
});
