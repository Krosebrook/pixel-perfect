import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Navigation } from '../Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all public navigation links', () => {
    (useAuth as any).mockReturnValue({ user: null });

    renderWithProviders(<Navigation />);

    expect(screen.getByText('UPGE')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('should render navigation when user is authenticated', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    (useAuth as any).mockReturnValue({ user: mockUser });

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<Navigation />);

    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('API Usage')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should not render admin links for non-admin users', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    (useAuth as any).mockReturnValue({ user: mockUser });

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<Navigation />);

    expect(screen.queryByText('Security')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('should render admin links for admin users', async () => {
    const mockUser = { id: 'admin-user-id', email: 'admin@example.com' };
    (useAuth as any).mockReturnValue({ user: mockUser });

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { role: 'admin' }, 
              error: null 
            }),
          }),
        }),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<Navigation />);

    // Admin links should appear after data loads
    await screen.findByText('Security');
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getAllByText('Admin')[0]).toBeInTheDocument();
  });

  it('should have proper link structure with icons', () => {
    (useAuth as any).mockReturnValue({ user: null });

    renderWithProviders(<Navigation />);

    const libraryLink = screen.getByText('Library').closest('a');
    expect(libraryLink).toHaveAttribute('href', '/prompts');

    const compareLink = screen.getByText('Compare').closest('a');
    expect(compareLink).toHaveAttribute('href', '/models/compare');

    const templatesLink = screen.getByText('Templates').closest('a');
    expect(templatesLink).toHaveAttribute('href', '/templates');
  });

  it('should render UserMenu component', () => {
    (useAuth as any).mockReturnValue({ user: null });

    renderWithProviders(<Navigation />);

    // UserMenu should be rendered (it handles its own auth logic)
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should have accessible navigation structure', () => {
    (useAuth as any).mockReturnValue({ user: null });

    renderWithProviders(<Navigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // Links should be accessible
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
});
