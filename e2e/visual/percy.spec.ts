import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { TEST_USERS } from '../fixtures/test-data';

/**
 * Percy Visual Regression Tests
 * 
 * These tests capture full-page snapshots and send them to Percy for
 * cross-browser visual regression testing.
 * 
 * Percy provides:
 * - Cross-browser testing (Chrome, Firefox, Safari, Edge)
 * - Responsive testing at multiple widths
 * - Smart visual diffing with AI
 * - Review and approval workflow
 */

test.describe('Percy Visual Tests - Public Pages', () => {
  test('auth page - all viewports', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Auth Page', {
      widths: [375, 768, 1280, 1920],
      minHeight: 1024,
    });
  });

  test('not found page', async ({ page }) => {
    await page.goto('/non-existent-route');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Not Found Page', {
      widths: [375, 1280],
    });
  });
});

test.describe('Percy Visual Tests - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
  });

  test('dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard', {
      widths: [375, 768, 1280],
      percyCSS: `
        .timestamp, time, [data-testid="real-time-data"] { visibility: hidden; }
      `,
    });
  });

  test('analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Analytics', {
      widths: [768, 1280, 1920],
      percyCSS: `
        .recharts-wrapper { visibility: hidden; }
        time { visibility: hidden; }
      `,
    });
  });

  test('model comparison page', async ({ page }) => {
    await page.goto('/model-comparison');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Model Comparison', {
      widths: [768, 1280],
    });
  });

  test('templates page', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Templates', {
      widths: [375, 768, 1280],
    });
  });

  test('prompts page', async ({ page }) => {
    await page.goto('/prompts');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Prompts Library', {
      widths: [768, 1280],
    });
  });

  test('settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Settings', {
      widths: [375, 768, 1280],
    });
  });

  test('batch testing page', async ({ page }) => {
    await page.goto('/batch-testing');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Batch Testing', {
      widths: [768, 1280],
    });
  });

  test('leaderboard page', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Leaderboard', {
      widths: [375, 768, 1280],
    });
  });

  test('test coverage dashboard', async ({ page }) => {
    await page.goto('/test-coverage');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Test Coverage Dashboard', {
      widths: [768, 1280, 1920],
    });
  });
});

test.describe('Percy Visual Tests - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
  });

  test('auth page - dark mode', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Auth Page - Dark Mode', {
      widths: [375, 1280],
    });
  });
});

test.describe('Percy Visual Tests - Component States', () => {
  test('form validation errors', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      await percySnapshot(page, 'Form Validation Errors', {
        widths: [375, 768],
      });
    }
  });

  test('keyboard focus states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Tab through elements
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }
    
    await percySnapshot(page, 'Keyboard Focus States', {
      widths: [768],
    });
  });
});
