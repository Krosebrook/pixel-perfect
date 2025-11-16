# Testing Guide

This document outlines the comprehensive testing strategy for the PromptLab project, including unit tests, integration tests, E2E tests, and visual regression testing.

## Overview

This project uses multiple layers of testing to ensure code quality, reliability, and maintainability across all aspects of the application.

### Testing Philosophy

- **Test behavior, not implementation**: Focus on how components behave from a user's perspective
- **Write tests that mirror actual usage**: Tests should reflect how real users interact with the application
- **Maintain high coverage**: Aim for 80%+ code coverage across the codebase
- **Fast feedback**: Tests should run quickly to enable rapid development

## Testing Stack

### Unit & Integration Testing
- **Vitest v4.0.9**: Fast unit test framework with great TypeScript support
- **React Testing Library v16.3.0**: Testing utilities for React components
- **jsdom**: DOM implementation for Node.js
- **@testing-library/user-event**: User interaction simulation

### E2E Testing
- **Playwright**: Modern E2E testing framework
- **@axe-core/playwright**: Accessibility testing
- Cross-browser support (Chromium, Firefox, WebKit)

### Visual Regression Testing
- **Chromatic**: Storybook-integrated visual testing
- **Playwright Screenshots**: Built-in visual comparisons
- Automatic baseline management

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run tests once (for CI)
npm run test:run
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# Run tests for specific browser
npx playwright test --project=chromium

# Generate E2E test report
npm run test:e2e:report
```

### Visual Regression Tests

```bash
# Run visual regression tests
npx playwright test e2e/visual

# Update visual baselines
npx playwright test --update-snapshots

# Run Chromatic
npm run chromatic
```

## Writing Tests

### Directory Structure

```
src/
├── components/
│   ├── __tests__/
│   │   ├── ErrorMessage.test.tsx
│   │   ├── RateLimitMonitor.test.tsx
│   │   └── ...
│   └── ErrorMessage.tsx
├── hooks/
│   ├── __tests__/
│   │   ├── useProfile.test.ts
│   │   └── ...
│   └── useProfile.ts
└── lib/
    ├── __tests__/
    │   ├── formatters.test.ts
    │   └── ...
    └── formatters.ts
```

### Test File Naming

- Place tests in `__tests__/` directories next to the code they test
- Name test files with `.test.ts` or `.test.tsx` extension
- Match the filename of the module being tested: `formatters.ts` → `formatters.test.ts`

### Unit Tests for Utilities

Test pure functions and utility modules:

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatTime } from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency with default decimals', () => {
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(10.5)).toBe('$10.50');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234.56)).toBe('$1234.56');
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(5000)).toBe('5s');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(65000)).toBe('1m 5s');
    });
  });
});
```

### Unit Tests for Custom Hooks

Use `renderHook` from `@testing-library/react` with our custom wrapper:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@/test/test-utils';
import { useProfile } from '../useProfile';
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
});
```

### Component Tests

Test components with user interactions:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { AuthForm } from '../AuthForm';

describe('AuthForm', () => {
  it('should render login form by default', () => {
    renderWithProviders(<AuthForm />);
    expect(screen.getByRole('tab', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should switch to signup tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);
    
    const signupTab = screen.getByRole('tab', { name: /sign up/i });
    await user.click(signupTab);
    
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.fn();
    
    renderWithProviders(<AuthForm />, {
      authContextValue: { signIn: mockSignIn }
    });
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

## Test Utilities

### `renderWithProviders()`

Custom render function that wraps components with all necessary providers:

```typescript
import { renderWithProviders } from '@/test/test-utils';

const { getByText, queryByText } = renderWithProviders(
  <MyComponent />
);
```

Includes:
- QueryClientProvider (React Query)
- BrowserRouter (React Router)
- Custom QueryClient with disabled retries

### `createWrapper()`

Wrapper component for testing hooks with React Query:

```typescript
import { renderHook } from '@testing-library/react';
import { createWrapper } from '@/test/test-utils';

const { result } = renderHook(() => useMyHook(), {
  wrapper: createWrapper(),
});
```

### Mock Data Generators

Pre-configured mock data for common types:

```typescript
import { 
  mockUserProfile,
  mockUserBudget,
  mockRateLimitConfig,
  mockRateLimitUsage 
} from '@/test/test-utils';
```

## Mocking Patterns

### Supabase Client

The Supabase client is automatically mocked in `src/test/setup.ts`. Override specific methods in tests:

```typescript
vi.mock('@/integrations/supabase/client');

const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })),
  })),
}));
(supabase.from as any) = mockFrom;
```

### React Router

React Router hooks are mocked globally. Override in tests if needed:

```typescript
import { vi } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-id' }),
  };
});
```

### Auth Context

Mock the Auth context for protected components:

```typescript
const mockUser = { id: 'test-user', email: 'test@example.com' };

renderWithProviders(<ProtectedComponent />, {
  authContextValue: {
    user: mockUser,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }
});
```

## Best Practices

### 1. Use `screen` Queries

Prefer `screen` from Testing Library over destructuring from `render`:

```typescript
// ✅ Good
import { screen } from '@/test/test-utils';
renderWithProviders(<Component />);
const button = screen.getByRole('button');

// ❌ Avoid
const { getByRole } = renderWithProviders(<Component />);
const button = getByRole('button');
```

### 2. Query Priority

Follow this order when selecting elements:

1. **Accessible queries** (preferred):
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`

2. **Semantic queries**:
   - `getByAltText`
   - `getByTitle`

3. **Test IDs** (last resort):
   - `getByTestId`

### 3. Use `userEvent` Over `fireEvent`

`userEvent` more accurately simulates real user interactions:

```typescript
import { userEvent } from '@/test/test-utils';

// ✅ Good
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'Hello');

// ❌ Avoid
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'Hello' } });
```

### 4. Async Testing

Use `waitFor` for async operations:

```typescript
import { waitFor } from '@/test/test-utils';

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

### 5. Test Accessibility

Verify components are accessible:

```typescript
it('should be accessible', () => {
  const { container } = renderWithProviders(<Component />);
  
  // Check for proper labels
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  
  // Check for ARIA attributes
  expect(screen.getByRole('button')).toHaveAttribute('aria-label');
});
```

### 6. Avoid Testing Implementation Details

```typescript
// ❌ Bad - testing implementation
it('should update state on click', () => {
  const { result } = renderHook(() => useState(0));
  act(() => {
    result.current[1](1);
  });
  expect(result.current[0]).toBe(1);
});

// ✅ Good - testing behavior
it('should increment counter on click', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Counter />);
  
  await user.click(screen.getByRole('button', { name: /increment/i }));
  
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

## Coverage Thresholds

We maintain the following minimum coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

These are enforced in `vitest.config.ts` and CI pipelines.

### Excluded from Coverage

- `node_modules/`
- `src/test/` - Test utilities themselves
- `**/*.test.{ts,tsx}` - Test files
- `**/*.stories.{ts,tsx}` - Storybook stories
- `src/integrations/supabase/types.ts` - Auto-generated types
- `.storybook/` - Storybook configuration

## Common Testing Scenarios

### Testing Loading States

```typescript
it('should show loading state', () => {
  renderWithProviders(<Component />);
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('should handle errors gracefully', async () => {
  const mockError = new Error('Failed to load');
  (supabase.from as any).mockRejectedValue(mockError);
  
  renderWithProviders(<Component />);
  
  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

### Testing Forms

```typescript
it('should validate form inputs', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Form />);
  
  // Submit without filling
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  // Expect validation errors
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

### Testing Conditional Rendering

```typescript
it('should show admin panel for admin users', () => {
  renderWithProviders(<Dashboard />, {
    authContextValue: { 
      user: { ...mockUser, role: 'admin' } 
    }
  });
  
  expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
});

it('should hide admin panel for regular users', () => {
  renderWithProviders(<Dashboard />, {
    authContextValue: { 
      user: { ...mockUser, role: 'user' } 
    }
  });
  
  expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
});
```

## Debugging Tests

### Using `screen.debug()`

Print the current DOM state:

```typescript
import { screen } from '@/test/test-utils';

it('debug example', () => {
  renderWithProviders(<Component />);
  screen.debug(); // Prints entire document
  screen.debug(screen.getByRole('button')); // Prints specific element
});
```

### Using Vitest UI

The Vitest UI (`npm run test:ui`) provides:
- Visual test explorer
- Test execution timeline
- Console logs per test
- Coverage reports
- Source code view with execution highlights

### Common Pitfalls

1. **Forgetting to await async operations**:
   ```typescript
   // ❌ Wrong
   user.click(button);
   expect(result).toBe(true);
   
   // ✅ Correct
   await user.click(button);
   expect(result).toBe(true);
   ```

2. **Not cleaning up timers**:
   ```typescript
   // ✅ Clean up
   beforeEach(() => {
     vi.useFakeTimers();
   });
   
   afterEach(() => {
     vi.restoreAllMocks();
   });
   ```

3. **Incorrect query for async content**:
   ```typescript
   // ❌ Wrong - throws immediately if not found
   expect(screen.getByText('Loaded')).toBeInTheDocument();
   
   // ✅ Correct - waits for element
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices](https://testingjavascript.com/)
