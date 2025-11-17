import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import { createTestUser, getTestUserToken, cleanupTestUser } from './helpers/test-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-prompt`;

Deno.test('Generate Prompt: Successfully generates a prompt', async () => {
  const testEmail = `test-generate-${Date.now()}@example.com`;
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
        problem: 'Create a marketing email',
        goalType: 'creative',
        modelTarget: 'gpt-4',
        format: 'structured',
        precision: 'high',
      }),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data.generatedPrompt);
    assertExists(data.promptId);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Generate Prompt: Rejects invalid input', async () => {
  const testEmail = `test-generate-invalid-${Date.now()}@example.com`;
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
        problem: '', // Empty problem should fail
        goalType: 'creative',
        modelTarget: 'gpt-4',
      }),
    });

    assertEquals(response.status, 400);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Generate Prompt: Requires authentication', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      problem: 'Create a marketing email',
      goalType: 'creative',
      modelTarget: 'gpt-4',
    }),
  });

  assertEquals(response.status, 401);
});
