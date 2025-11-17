# Supabase Edge Function Tests

This directory contains integration and security tests for all Supabase edge functions.

## Test Structure

### Helper Utilities (`helpers/test-utils.ts`)
- `createTestUser()` - Creates a test user with specified environment mode
- `getTestUserToken()` - Gets JWT token for test user
- `cleanupTestUser()` - Removes test user after tests
- `createTestUserWithBudget()` - Creates user with specific budget limits

### Test Categories

#### Security Tests (`security.test.ts`)
- Authentication and authorization
- Rate limiting enforcement
- Budget limit checks
- Input validation and sanitization

#### RLS Tests (`rls.test.ts`)
- Row-level security policies
- User data isolation
- Access control verification

#### Validation Tests (`validation.test.ts`)
- Input size limits
- Required field validation
- Data type validation

#### Function-Specific Integration Tests
- `generate-prompt.test.ts` - Prompt generation functionality
- `run-comparison.test.ts` - Model comparison features
- `validate-quality.test.ts` - Quality validation logic
- `apply-template.test.ts` - Template application
- `optimize-prompt.test.ts` - Prompt optimization

## Running Tests

### Prerequisites
```bash
# Ensure environment variables are set
export SUPABASE_URL="your-project-url"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Run All Tests
```bash
cd supabase/functions/_tests
deno test --allow-net --allow-env --allow-read
```

### Run Specific Test Suite
```bash
deno test --allow-net --allow-env --allow-read security.test.ts
deno test --allow-net --allow-env --allow-read generate-prompt.test.ts
```

### Run with Coverage
```bash
deno test --allow-net --allow-env --allow-read --coverage=coverage
deno coverage coverage
```

## CI/CD Integration

Tests run automatically via GitHub Actions (`.github/workflows/security-tests.yml`):
- On every push to `main` and `develop`
- On all pull requests
- Every 6 hours on a schedule

## Test Best Practices

1. **Cleanup**: Always cleanup test users in `finally` blocks
2. **Unique Identifiers**: Use timestamps in test emails to avoid conflicts
3. **Isolation**: Each test should be independent and not rely on others
4. **Assertions**: Use specific assertions from `std/testing/asserts.ts`
5. **Error Cases**: Test both success and failure scenarios
6. **Rate Limits**: Be aware of rate limits when testing multiple requests

## Common Test Patterns

### Creating Test User
```typescript
const testEmail = `test-${Date.now()}@example.com`;
const userId = await createTestUser(testEmail, 'sandbox');
const token = await getTestUserToken(testEmail);

try {
  // Your test logic
} finally {
  await cleanupTestUser(userId);
}
```

### Testing Edge Function
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/function-name`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ /* payload */ }),
});

assertEquals(response.status, 200);
const data = await response.json();
assertExists(data.expectedField);
```

## Troubleshooting

### Tests Failing Locally
- Ensure Supabase project is running
- Verify environment variables are set correctly
- Check network connectivity to Supabase

### Rate Limit Errors
- Tests may hit rate limits if run too frequently
- Wait a few minutes between test runs
- Use different test users for parallel test execution

### Authentication Errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` has proper permissions
- Ensure test users are properly cleaned up between runs
