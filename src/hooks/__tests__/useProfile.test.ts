import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@/test/test-utils';
import { useProfile, useEnvironmentMode } from '../useProfile';
import { supabase } from '@/integrations/supabase/client';
import { createWrapper, mockUserProfile } from '@/test/test-utils';

vi.mock('@/integrations/supabase/client');

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch profile successfully', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useProfile('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUserProfile);
  });

  it('should not fetch if userId is undefined', () => {
    const { result } = renderHook(() => useProfile(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle errors', async () => {
    const mockError = new Error('Profile not found');
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useProfile('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useEnvironmentMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch environment mode successfully', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { environment_mode: 'sandbox' },
            error: null,
          }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useEnvironmentMode('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe('sandbox');
  });
});
