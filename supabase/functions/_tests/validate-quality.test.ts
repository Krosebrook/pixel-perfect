import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import { createTestUser, getTestUserToken, cleanupTestUser } from './helpers/test-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/validate-quality`;

Deno.test('Validate Quality: Successfully validates a prompt', async () => {
  const testEmail = `test-validate-${Date.now()}@example.com`;
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
        prompt: 'Write a detailed technical documentation for a REST API that handles user authentication.',
        context: 'API documentation',
      }),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data.scores);
    assertExists(data.scores.clarity);
    assertExists(data.scores.specificity);
    assertExists(data.scores.completeness);
    assertExists(data.overallScore);
    assertExists(data.suggestions);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Validate Quality: Requires prompt text', async () => {
  const testEmail = `test-validate-empty-${Date.now()}@example.com`;
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
      }),
    });

    assertEquals(response.status, 400);
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test('Validate Quality: Returns lower scores for vague prompts', async () => {
  const testEmail = `test-validate-vague-${Date.now()}@example.com`;
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
        prompt: 'Do something',
      }),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    // Vague prompts should have lower overall scores
    assertEquals(data.overallScore < 70, true);
  } finally {
    await cleanupTestUser(userId);
  }
});
