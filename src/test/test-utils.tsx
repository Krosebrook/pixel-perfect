/**
 * Custom test utilities for React Testing Library
 * 
 * This file provides wrapped render functions that include all necessary providers
 * for testing components that depend on routing, authentication, queries, etc.
 * 
 * @example
 * ```typescript
 * import { render, screen, waitFor } from '@/test/test-utils';
 * 
 * test('my component', async () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 *   await waitFor(() => expect(screen.getByText('Loaded')).toBeVisible());
 * });
 * ```
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { UserProfile } from '@/types/profile';
import type { UserBudget } from '@/types/budget';
import type { RateLimitConfig, RateLimitUsage } from '@/types/api';

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Custom render with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Wrapper component for hook testing
export function createWrapper() {
  const queryClient = createTestQueryClient();
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

// Mock data generators
export const mockUserProfile: UserProfile = {
  id: 'test-user-id',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  environment_mode: 'sandbox',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockUserBudget: UserBudget = {
  id: 'test-budget-id',
  user_id: 'test-user-id',
  environment_mode: 'sandbox',
  monthly_budget: 100,
  daily_limit: 10,
  current_spending: 25.5,
  alert_threshold: 0.8,
  email_notifications_enabled: true,
  notification_email: 'test@example.com',
  period_start: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockRateLimitConfig: RateLimitConfig[] = [
  {
    endpoint_name: 'run-comparison',
    max_calls_per_minute: 10,
    max_calls_per_hour: 100,
    max_calls_per_day: 1000,
  },
  {
    endpoint_name: 'generate-prompt',
    max_calls_per_minute: 5,
    max_calls_per_hour: 50,
    max_calls_per_day: 500,
  },
];

export const mockRateLimitUsage: RateLimitUsage[] = [
  {
    endpoint: 'run-comparison',
    minute: {
      used: 3,
      limit: 10,
      resetIn: 30000,
    },
    hour: {
      used: 45,
      limit: 100,
      resetIn: 1800000,
    },
    day: {
      used: 250,
      limit: 1000,
      resetIn: 43200000,
    },
  },
];

/**
 * Re-export all utilities from React Testing Library
 * 
 * This includes:
 * - screen: Query the rendered DOM
 * - waitFor: Wait for async operations
 * - within: Scope queries to a specific element
 * - fireEvent: Fire DOM events
 * - cleanup: Clean up after tests
 * - render: Basic render (use renderWithProviders instead)
 * 
 * @see https://testing-library.com/docs/react-testing-library/api
 */
export * from '@testing-library/react';

/**
 * User event utilities for simulating user interactions
 * 
 * @example
 * ```typescript
 * import userEvent from '@testing-library/user-event';
 * 
 * const user = userEvent.setup();
 * await user.type(screen.getByLabelText('Email'), 'test@example.com');
 * await user.click(screen.getByRole('button', { name: 'Submit' }));
 * ```
 */
export { default as userEvent } from '@testing-library/user-event';
