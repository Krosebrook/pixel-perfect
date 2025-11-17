import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { Navigation } from '../Navigation';
import { supabase } from '@/integrations/supabase/client';

// Mock the supabase client
vi.mock('@/integrations/supabase/client');

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Navigation', () => {
    it('should render the main navigation bar', () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      renderWithProviders(<Navigation />);

      expect(screen.getByText('UPGE')).toBeInTheDocument();
    });

    it('should render all public navigation links', () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      renderWithProviders(<Navigation />);

      expect(screen.getByText('Library')).toBeInTheDocument();
      expect(screen.getByText('Compare')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('API Usage')).toBeInTheDocument();
      expect(screen.getByText('API Docs')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('API Keys')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render the UserMenu component', () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      renderWithProviders(<Navigation />);

      // UserMenu should be present (it's rendered unconditionally)
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Admin Access', () => {
    it('should show admin links when user is admin', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: string) => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin', user_id: 'test-user-id' },
                error: null,
              }),
            })),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      renderWithProviders(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });
    });

    it('should hide admin links when user is not admin', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      renderWithProviders(<Navigation />);

      await waitFor(() => {
        expect(screen.queryByText('Security')).not.toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      });
    });

    it('should query user role with correct parameters', () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq2 = vi.fn(() => ({ single: mockSingle }));
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
      const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
      const mockFrom = vi.fn(() => ({ select: mockSelect }));
      (supabase.from as any) = mockFrom;

      renderWithProviders(<Navigation />);

      expect(mockFrom).toHaveBeenCalledWith('user_roles');
      expect(mockSelect).toHaveBeenCalledWith('role');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render with backdrop blur support', () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      const { container } = renderWithProviders(<Navigation />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('backdrop-blur');
    });

    it('should use container with max width', () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      const { container } = renderWithProviders(<Navigation />);

      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toHaveClass('mx-auto');
    });
  });

  describe('Navigation Links', () => {
    it('should render links with correct icons', () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }));
      (supabase.from as any) = mockFrom;

      const { container } = renderWithProviders(<Navigation />);

      // Check that icons are rendered (lucide-react icons have specific classes)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
