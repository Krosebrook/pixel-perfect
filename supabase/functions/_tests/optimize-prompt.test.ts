import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import { createTestUser, getTestUserToken, cleanupTestUser } from './helpers/test-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/optimize-prompt`;

Deno.test('Optimize Prompt: Successfully optimizes a vague prompt', async () => {
  const testEmail = `test-optimize-${Date.now()}@example.com`;
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
        prompt: 'Write something about dogs',
        targetModel: 'gpt-4',
        optimizationGoal: 'clarity',
      }),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data.optimizedPrompt);
    assertExists(data.improvements);
    assertExists(data.beforeScore);
    assertExists(data.afterScore);
    // Optimized prompt should be longer/more detailed
    assertEquals(data.optimizedPrompt.length > 30, true);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Optimize Prompt: Requires prompt text', async () => {
  const testEmail = `test-optimize-empty-${Date.now()}@example.com`;
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
        prompt: '',
        targetModel: 'gpt-4',
      }),
    });

    assertEquals(response.status, 400);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Optimize Prompt: Supports different optimization goals', async () => {
  const testEmail = `test-optimize-goals-${Date.now()}@example.com`;
  const userId = await createTestUser(testEmail, 'sandbox');
  const token = await getTestUserToken(testEmail);

  try {
    const goals = ['clarity', 'specificity', 'brevity'];
    
    for (const goal of goals) {
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Write about technology',
          targetModel: 'gpt-4',
          optimizationGoal: goal,
        }),
      });

      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data.optimizedPrompt);
    }
  } finally {
    await cleanupTestUser(userId);
  }
});
