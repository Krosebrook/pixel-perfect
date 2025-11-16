/**
 * Test data for E2E tests
 */

export const TEST_USERS = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    displayName: 'Test User',
  },
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'NewPassword123!',
    displayName: 'New Test User',
  },
};

export const TEST_PROMPTS = {
  basic: {
    name: 'Test Prompt',
    problem: 'Generate a creative story',
    goalType: 'creative',
    modelTarget: 'gpt-4',
    format: 'narrative',
    precision: 'balanced',
  },
  technical: {
    name: 'Technical Prompt',
    problem: 'Write a Python function',
    goalType: 'technical',
    modelTarget: 'gpt-4',
    format: 'code',
    precision: 'precise',
  },
};

export const TEST_MODELS = ['gpt-4', 'gpt-3.5-turbo', 'claude-2'];
