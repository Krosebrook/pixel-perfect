import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createTestUser, getTestUserToken, cleanupTestUser } from './helpers/test-utils.ts';

const BASE_URL = Deno.env.get('SUPABASE_URL') + '/functions/v1';

Deno.test("Validation: Rejects oversized strings", async () => {
  const email = `validation-size-${Date.now()}@example.com`;
  const userId = await createTestUser(email, 'production');

  try {
    const token = await getTestUserToken(email);
    
    const response = await fetch(`${BASE_URL}/run-comparison`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'x'.repeat(15000), // Over 10k limit
        models: ['gpt-5-mini']
      })
    });

    assertEquals(response.status, 400, "Should reject oversized prompt");

  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test("Validation: Accepts maximum allowed length", async () => {
  const email = `validation-max-${Date.now()}@example.com`;
  const userId = await createTestUser(email, 'production');

  try {
    const token = await getTestUserToken(email);
    
    const response = await fetch(`${BASE_URL}/run-comparison`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'x'.repeat(10000), // Exactly 10k
        models: ['gpt-5-mini']
      })
    });

    assertEquals(
      response.status !== 400, 
      true, 
      "Should accept max length prompt (status: " + response.status + ")"
    );

  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test("Validation: Rejects oversized arrays", async () => {
  const email = `validation-array-${Date.now()}@example.com`;
  const userId = await createTestUser(email, 'production');

  try {
    const token = await getTestUserToken(email);
    
    const response = await fetch(`${BASE_URL}/run-comparison`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'test',
        models: Array(15).fill('gpt-5-mini') // Over 10 model limit
      })
    });

    assertEquals(response.status, 400, "Should reject arrays exceeding limits");

  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test("Validation: Rejects missing required fields", async () => {
  const email = `validation-missing-${Date.now()}@example.com`;
  const userId = await createTestUser(email, 'production');

  try {
    const token = await getTestUserToken(email);
    
    // Missing models field
    const response1 = await fetch(`${BASE_URL}/run-comparison`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'test'
      })
    });

    assertEquals(response1.status, 400, "Should reject missing models field");

    // Missing prompt field
    const response2 = await fetch(`${BASE_URL}/run-comparison`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        models: ['gpt-5-mini']
      })
    });

    assertEquals(response2.status, 400, "Should reject missing prompt field");

  } finally {
    await cleanupTestUser(userId);
  }
});
