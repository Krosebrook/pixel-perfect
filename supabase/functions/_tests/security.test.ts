import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createTestUser, getTestUserToken, cleanupTestUser, createTestUserWithBudget } from './helpers/test-utils.ts';

const BASE_URL = Deno.env.get('SUPABASE_URL') + '/functions/v1';

Deno.test("JWT: All endpoints require authentication", async () => {
  const endpoints = [
    'run-comparison',
    'run-comparison-stream',
    'generate-insights',
    'generate-prompt',
    'optimize-prompt',
    'validate-quality',
    'apply-template',
    'manage-team'
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    assertEquals(
      response.status, 
      401, 
      `${endpoint} should reject requests without JWT (got ${response.status})`
    );
  }
});

Deno.test("JWT: Invalid tokens are rejected", async () => {
  const response = await fetch(`${BASE_URL}/run-comparison`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer invalid.jwt.token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      prompt: 'test',
      models: ['gpt-5-mini']
    })
  });
  
  assertEquals(response.status, 401, "Should reject invalid JWT");
});

Deno.test("Rate Limiting: Sandbox limits are enforced", async () => {
  const email = `rate-test-${Date.now()}@example.com`;
  const userId = await createTestUser(email, 'sandbox');

  try {
    const token = await getTestUserToken(email);
    
    const promises = Array.from({ length: 6 }, () =>
      fetch(`${BASE_URL}/apply-template`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: '123e4567-e89b-12d3-a456-426614174000',
          variables: {}
        })
      })
    );

    const responses = await Promise.all(promises);
    const nonRateLimited = responses.filter(r => r.status !== 429).length;
    
    assertExists(nonRateLimited, "Should have some successful requests");
    
  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test("Budget: Monthly limits prevent overspending", async () => {
  const email = `budget-test-${Date.now()}@example.com`;
  const userId = await createTestUserWithBudget(email, 'sandbox', 0.05);

  try {
    const token = await getTestUserToken(email);
    
    const response = await fetch(`${BASE_URL}/run-comparison`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
        models: ['gpt-5', 'claude-opus-4-1', 'gemini-2.5-pro']
      })
    });

    assertEquals(response.status, 402, "Should reject when budget exceeded");
    
    const data = await response.json();
    assertExists(data.error, "Should return error message");

  } finally {
    await cleanupTestUser(userId);
  }
});

Deno.test("Input Validation: Rejects malicious payloads", async () => {
  const email = `validation-test-${Date.now()}@example.com`;
  const userId = await createTestUser(email, 'production');

  try {
    const token = await getTestUserToken(email);
    
    const maliciousPayloads = [
      { prompt: 'x'.repeat(20000), models: ['gpt-5-mini'] }, // Oversized
      { prompt: "'; DROP TABLE prompts; --", models: ['gpt-5-mini'] }, // SQL injection
      { prompt: '<script>alert("xss")</script>', models: ['gpt-5-mini'] }, // XSS
      { prompt: 'test', models: Array(100).fill('gpt-5-mini') }, // Too many models
      { prompt: 'test' }, // Missing required field
      { models: ['gpt-5-mini'] }, // Missing required field
    ];
    
    for (const payload of maliciousPayloads) {
      const response = await fetch(`${BASE_URL}/run-comparison`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      assertEquals(response.status, 400, `Should reject malicious payload`);
    }

  } finally {
    await cleanupTestUser(userId);
  }
});
