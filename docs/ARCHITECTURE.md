# Architecture Documentation

## Project Overview

**UPGE (Universal Prompt Generator Engine)** is a comprehensive platform for creating, testing, comparing, and managing AI prompts across multiple language models. The application provides tools for prompt engineering, model comparison, analytics, team collaboration, and API access.

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- React Router v6 (routing)
- React Query (data fetching & caching)
- Recharts (data visualization)

**Backend:**
- Lovable Cloud (Supabase)
- PostgreSQL (database)
- Row Level Security (RLS) policies
- Edge Functions (serverless functions)
- Real-time subscriptions

**Testing & Documentation:**
- Vitest + React Testing Library
- Storybook for component documentation

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Pages     │  │  Components  │  │     Hooks    │      │
│  │   (Routes)   │  │   (UI/Feat)  │  │   (Logic)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Query (State Management)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │  Supabase Client  │
                   └─────────┬─────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     Backend Layer (Lovable Cloud)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Edge Funcs  │  │  Auth/RLS    │      │
│  │   Database   │  │  (Serverless)│  │  Security    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── ErrorBoundary.tsx
│   ├── QueryErrorBoundary.tsx
│   ├── RouteErrorBoundary.tsx
│   ├── Navigation.tsx
│   ├── AuthForm.tsx
│   ├── RateLimitMonitor.tsx
│   ├── CostTracker.tsx
│   └── __tests__/       # Component tests
│
├── pages/               # Route pages
│   ├── Index.tsx
│   ├── Auth.tsx
│   ├── Analytics.tsx
│   ├── Settings.tsx
│   ├── Prompts.tsx
│   └── __tests__/       # Page tests
│
├── hooks/               # Custom React hooks
│   ├── useProfile.ts
│   ├── useLocalProfile.ts  # localStorage-based profile
│   ├── useBudget.ts
│   ├── useRateLimits.ts
│   ├── useAnalytics.ts
│   ├── useApiUsage.ts
│   └── __tests__/       # Hook tests
│
├── contexts/            # React context providers
│   ├── AuthContext.tsx
│   └── OnboardingContext.tsx
│
├── types/               # TypeScript type definitions
│   ├── api.ts
│   ├── budget.ts
│   ├── profile.ts
│   └── prompt.ts
│
├── lib/                 # Utility functions
│   ├── formatters.ts    # Formatting utilities
│   ├── constants.ts     # App constants
│   ├── demo-data.ts     # Fallback demo prompts
│   ├── utils.ts         # General utilities
│   ├── error-utils.ts   # Error handling
│   └── __tests__/       # Utility tests
│
├── integrations/        # External integrations
│   └── supabase/
│       ├── client.ts    # Supabase client (auto-generated)
│       └── types.ts     # Database types (auto-generated)
│
├── test/                # Test utilities
│   ├── setup.ts
│   └── test-utils.tsx
│
└── main.tsx            # Application entry point

supabase/
├── functions/           # Edge functions
│   ├── _shared/        # Shared utilities
│   ├── run-comparison/
│   ├── generate-prompt/
│   └── ...
└── migrations/         # Database migrations

docs/
├── TESTING.md          # Testing guide
└── ARCHITECTURE.md     # This file

.storybook/             # Storybook configuration
```

## Component Architecture

### Atomic Design Principles

Components are organized following atomic design methodology:

**Atoms** (`src/components/ui/`):
- Button, Input, Label, Badge, etc.
- Smallest building blocks
- Highly reusable
- No business logic

**Molecules** (`src/components/`):
- ErrorMessage, RateLimitMonitor, CostTracker
- Combinations of atoms
- Specific functionality
- Reusable across pages

**Organisms** (`src/components/`):
- Navigation, AuthForm, PromptForm
- Complex components
- Feature-specific
- May contain business logic

**Templates** (`src/pages/`):
- Page layouts
- Route components
- Compose organisms
- Handle page-level state

### Component Composition Patterns

```typescript
// Container/Presenter Pattern
export function RateLimitMonitor() {
  // Container: Data fetching & logic
  const { data } = useRateLimitUsage();
  
  if (!data) return null;
  
  // Presenter: Pure rendering
  return <RateLimitDisplay data={data} />;
}

// Compound Components
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>

// Render Props
<QueryErrorBoundary
  fallback={(error) => <ErrorDisplay error={error} />}
>
  <DataComponent />
</QueryErrorBoundary>
```

## Data Flow

### State Management Strategy

**Server State** (React Query):
- API responses
- Database queries
- Cached automatically
- Background refetching
- Optimistic updates

**Client State** (React State/Context):
- UI state (modals, forms)
- Authentication state
- Theme preferences
- Temporary user input

### React Query Architecture

```typescript
// Custom hooks encapsulate queries
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage in components
function ProfileDisplay() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  
  if (isLoading) return <Skeleton />;
  return <div>{profile.display_name}</div>;
}
```

### Data Fetching Patterns

1. **Query Hooks**: Fetch and cache data
2. **Mutation Hooks**: Update data with optimistic updates
3. **Refetch on Window Focus**: Keep data fresh
4. **Background Updates**: Automatic stale-while-revalidate
5. **Query Invalidation**: Manual cache updates after mutations

## Error Handling Strategy

### 3-Layer Error Boundary System

```
App
 └─ ErrorBoundary (Top-level)
     └─ QueryClientProvider
         └─ QueryErrorBoundary (React Query errors)
             └─ Routes
                 └─ RouteErrorBoundary (Route-specific)
                     └─ Page Components
```

**Layer 1: ErrorBoundary** (Top-level)
- Catches all React errors
- Last line of defense
- Shows generic error UI
- Logs to monitoring service
- Provides app-wide reset

**Layer 2: QueryErrorBoundary** (Data layer)
- Catches React Query errors
- Network failures
- API errors
- Authentication errors
- Provides retry mechanism

**Layer 3: RouteErrorBoundary** (Route-specific)
- Catches route-level errors
- 404 handling
- Navigation errors
- Provides route-specific recovery

### Error Logging & Monitoring

```typescript
// src/lib/error-utils.ts
export function logErrorToService(error: Error, context: ErrorContext) {
  // Send to monitoring service (e.g., Sentry)
  console.error('Error:', error, 'Context:', context);
  
  // Include user info, route, timestamp
  const errorReport = {
    message: error.message,
    stack: error.stack,
    user: context.userId,
    route: context.route,
    timestamp: new Date().toISOString(),
  };
  
  // Send to backend for tracking
  // await supabase.from('error_logs').insert(errorReport);
}
```

## Backend Integration

### Supabase Client Configuration

```typescript
// src/integrations/supabase/client.ts (auto-generated)
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

### Edge Functions Structure

```
supabase/functions/
├── _shared/
│   ├── errorFormatter.ts    # Consistent error responses
│   ├── rateLimiter.ts       # Rate limiting logic
│   └── schemas.ts           # Validation schemas
├── run-comparison/
│   └── index.ts            # Compare multiple models
├── generate-prompt/
│   └── index.ts            # Generate optimized prompts
└── validate-quality/
    └── index.ts            # Quality scoring
```

**Edge Function Pattern:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  // 1. Validate request
  const { error, data } = validateRequest(req);
  if (error) return jsonError(error, 400);
  
  // 2. Check authentication
  const supabase = createClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return jsonError('Unauthorized', 401);
  
  // 3. Check rate limits
  const limited = await checkRateLimit(user.id);
  if (limited) return jsonError('Rate limited', 429);
  
  // 4. Execute business logic
  const result = await processRequest(data);
  
  // 5. Return response
  return jsonResponse(result);
});
```

### Database Schema Patterns

**Core Tables:**
- `profiles` - User profiles
- `prompts` - User-created prompts
- `model_test_runs` - Model comparison results
- `user_budgets` - Budget tracking
- `api_rate_limits` - Rate limit tracking
- `api_keys` - API key management

**RLS Policies Pattern:**
```sql
-- Users can only see their own data
CREATE POLICY "Users view own data"
  ON public.prompts
  FOR SELECT
  USING (auth.uid() = created_by);

-- Public data visible to all
CREATE POLICY "Public prompts visible"
  ON public.prompts
  FOR SELECT
  USING (visibility = 'public');

-- Admin access
CREATE POLICY "Admins have full access"
  ON public.prompts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

## Routing

### Route Structure

All routes are currently public (no authentication required). The `AuthProvider` wraps
the tree for optional auth features but does not gate access.

```typescript
// src/App.tsx
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/prompts" element={<Prompts />} />
  <Route path="/prompts/:id" element={<PromptDetail />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/models/compare" element={<ModelComparison />} />
  <Route path="/models/batch" element={<BatchTesting />} />
  <Route path="/templates" element={<Templates />} />
  <Route path="/leaderboard" element={<Leaderboard />} />
  <Route path="/scheduled-tests" element={<ScheduledTests />} />
  <Route path="/teams" element={<Teams />} />
  <Route path="/api-usage" element={<ApiUsage />} />
  <Route path="/api-docs" element={<ApiDocs />} />
  <Route path="/security" element={<SecurityDashboard />} />
  <Route path="/security/audit-log" element={<SecurityAuditLog />} />
  <Route path="/analytics" element={<Analytics />} />
  <Route path="/api-keys" element={<ApiKeys />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/deployment-metrics" element={<DeploymentMetrics />} />
  <Route path="/test-coverage" element={<TestCoverage />} />
  <Route path="/share/:token" element={<SharedTestRun />} />
  <Route path="/terms" element={<TermsOfService />} />
  <Route path="/privacy" element={<PrivacyPolicy />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

> **Note:** `Auth.tsx` and `ProtectedRoute.tsx` exist in the codebase but are
> **not** currently wired into the router. To enable authentication gating,
> add a `/auth` route and wrap protected routes with `<ProtectedRoute>`.

### Local Profile System

When authentication is not active, user preferences are stored via `useLocalProfile`:

```typescript
// src/hooks/useLocalProfile.ts
const { profile, updateProfile } = useLocalProfile();
// Persists display_name, bio, environment_mode to localStorage
```

### Demo Data Fallback

The Prompts page loads from the database first. If the query returns no rows
(e.g., no authenticated user), it falls back to hardcoded demo prompts defined
in `src/lib/demo-data.ts`.

## Styling System

### Design Tokens

Colors, spacing, typography defined in semantic tokens:

```css
/* src/index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ...
      },
    },
  },
};
```

### Component Variants (CVA)

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
  }
);
```

### Responsive Design

Mobile-first approach with Tailwind breakpoints:

```typescript
<div className="
  grid 
  grid-cols-1         // Mobile: 1 column
  md:grid-cols-2      // Tablet: 2 columns
  lg:grid-cols-4      // Desktop: 4 columns
  gap-4
">
```

## Type Safety

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Generated Supabase Types

```typescript
// src/integrations/supabase/types.ts (auto-generated)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; /* ... */ };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      // ...
    };
  };
};

// Usage
const { data } = await supabase
  .from('profiles')  // Fully typed
  .select('*')       // Return type inferred
  .eq('id', userId); // Parameters typed
```

### Custom Type Definitions

```typescript
// src/types/api.ts
export interface RateLimitUsage {
  endpoint: string;
  minute: UsageWindow;
  hour: UsageWindow;
  day: UsageWindow;
}

interface UsageWindow {
  used: number;
  limit: number;
  resetIn: number; // milliseconds
}
```

## Testing Strategy

### Testing Pyramid

```
        ┌─────────┐
        │   E2E   │  (Manual testing, Storybook)
        ├─────────┤
        │Integration│  (Page tests, multi-component)
        ├─────────┤
        │   Unit   │  (Hook tests, utility tests)
        ├─────────┤
        │Component │  (UI component tests)
        └─────────┘
```

**Unit Tests** (60%):
- Utility functions (`formatters.ts`, `utils.ts`)
- Custom hooks (data fetching, state management)
- Pure logic functions

**Component Tests** (30%):
- UI components in isolation
- User interactions
- Conditional rendering
- Accessibility

**Integration Tests** (10%):
- Full page flows
- Multi-component interactions
- End-to-end user journeys

### Test Organization

```
src/
├── lib/
│   ├── formatters.ts
│   └── __tests__/
│       └── formatters.test.ts    # Test utilities
├── hooks/
│   ├── useProfile.ts
│   └── __tests__/
│       └── useProfile.test.ts    # Test hooks
└── components/
    ├── ErrorMessage.tsx
    └── __tests__/
        └── ErrorMessage.test.tsx # Test components
```

## Performance Optimization

### React Query Caching

```typescript
// Aggressive caching for static data
useQuery({
  queryKey: ['templates'],
  queryFn: fetchTemplates,
  staleTime: Infinity,          // Never stale
  cacheTime: 24 * 60 * 60 * 1000, // 24 hours
});

// Frequent updates for dynamic data
useQuery({
  queryKey: ['usage', userId],
  queryFn: fetchUsage,
  refetchInterval: 10000,        // Every 10 seconds
  staleTime: 5000,               // 5 seconds
});
```

### Code Splitting

```typescript
// Lazy load pages
const Analytics = lazy(() => import('@/pages/Analytics'));
const Settings = lazy(() => import('@/pages/Settings'));

// Usage with Suspense
<Suspense fallback={<LoadingScreen />}>
  <Analytics />
</Suspense>
```

### Memoization

```typescript
// Expensive calculations
const sortedData = useMemo(
  () => data.sort((a, b) => b.cost - a.cost),
  [data]
);

// Event handlers
const handleSubmit = useCallback(
  (values) => mutation.mutate(values),
  [mutation]
);
```

## Security Considerations

### Row Level Security (RLS)

All database tables use RLS policies to ensure users can only access their own data.

### Authentication Flow

1. User signs in via Supabase Auth
2. JWT token stored in localStorage
3. Token included in all API requests
4. Edge functions validate token
5. RLS policies enforce access control

### Input Validation

```typescript
// Edge functions validate all inputs
import { z } from 'zod';

const schema = z.object({
  prompt: z.string().min(1).max(5000),
  models: z.array(z.string()).min(1).max(5),
});

const { data, error } = schema.safeParse(request);
```

### XSS Prevention

- React escapes all user input by default
- Use `dangerouslySetInnerHTML` only when necessary
- Sanitize HTML with DOMPurify if needed

### API Rate Limiting

All endpoints enforce rate limits per user:
- Per minute: 10 requests
- Per hour: 100 requests
- Per day: 1000 requests

## Deployment & CI/CD

### Build Process

```bash
npm run build  # Vite builds optimized production bundle
```

Output: `dist/` directory with:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Source maps

### Testing in CI

```yaml
# .github/workflows/security-tests.yml
- name: Run Tests
  run: npm run test:run
  
- name: Check Coverage
  run: npm run test:coverage
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Future Enhancements

### Planned Improvements

- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Model performance benchmarking
- [ ] Prompt versioning system
- [ ] Team workspace management
- [ ] API webhook support
- [ ] Custom model integrations

### Technical Debt

- Refactor large page components into smaller modules
- Add E2E tests with Playwright
- Implement service worker for offline support
- Add telemetry and error tracking
- Optimize bundle size with tree shaking

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
