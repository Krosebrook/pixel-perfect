import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import { createTestUser, getTestUserToken, cleanupTestUser } from './helpers/test-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/run-comparison`;

Deno.test('Run Comparison: Successfully compares multiple models', async () => {
  const testEmail = `test-comparison-${Date.now()}@example.com`;
  const userId = await createTestUser(testEmail, 'sandbox');
  const token = await getTestUserToken(testEmail);

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Write a short story about a robot',
        models: ['gpt-4o-mini', 'gpt-4o'],
        parameters: {
          temperature: 0.7,
          maxTokens: 150,
        },
      }),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data.testRunId);
    assertExists(data.responses);
    assertEquals(data.responses.length, 2);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Run Comparison: Validates model count limit', async () => {
  const testEmail = `test-comparison-limit-${Date.now()}@example.com`;
  const userId = await createTestUser(testEmail, 'sandbox');
  const token = await getTestUserToken(testEmail);

  try {
    const tooManyModels = Array(11).fill('gpt-4o-mini'); // More than 10
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
        models: tooManyModels,
      }),
    });

    assertEquals(response.status, 400);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Run Comparison: Enforces rate limits in sandbox mode', async () => {
  const testEmail = `test-comparison-rate-${Date.now()}@example.com`;
  const userId = await createTestUser(testEmail, 'sandbox');
  const token = await getTestUserToken(testEmail);

  try {
    // Make multiple requests quickly
    const requests = Array(6).fill(null).map(() =>
      fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
          models: ['gpt-4o-mini'],
        }),
      })
    );

    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status);
    
    // At least one request should be rate limited (429)
    const hasRateLimitedRequest = statusCodes.some(code => code === 429);
    assertEquals(hasRateLimitedRequest, true);
  } finally {
    await cleanupTestUser(userId);
  }
});
