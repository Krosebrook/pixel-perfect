import { test, expect } from '@playwright/test';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { TEST_USERS } from '../fixtures/test-data';

/**
 * Visual Regression Tests
 * 
 * These tests capture screenshots of key pages and compare them against
 * baseline images to detect unintended visual changes.
 * 
 * Accessibility features tested:
 * - Consistent color contrast
 * - Focus indicators visibility
 * - Layout stability
 * - Responsive design breakpoints
 */

test.describe('Visual Regression Tests - Public Pages', () => {
  test('auth page - login form', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('auth-page-login.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('auth page - signup form', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Click signup tab if available
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.waitForTimeout(300);
    }
    
    await expect(page).toHaveScreenshot('auth-page-signup.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('auth page - focus states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Tab through form elements to show focus states
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    await expect(page).toHaveScreenshot('auth-page-focus-states.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('not found page', async ({ page }) => {
    await page.goto('/non-existent-route');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('not-found-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression Tests - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
  });

  test('dashboard - main view', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard-main.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [
        page.locator('.timestamp'),
        page.locator('[data-testid="real-time-data"]'),
        page.locator('time'),
      ],
    });
  });

  test('analytics page - overview', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('analytics-overview.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="chart"]'),
        page.locator('.recharts-wrapper'),
        page.locator('time'),
      ],
    });
  });

  test('model comparison page - empty state', async ({ page }) => {
    await page.goto('/model-comparison');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('model-comparison-empty.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('templates page - grid view', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('templates-grid.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('prompts page - list view', async ({ page }) => {
    await page.goto('/prompts');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('prompts-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('settings page - profile tab', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('settings-profile.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('[data-testid="user-avatar"]')],
    });
  });

  test('batch testing page', async ({ page }) => {
    await page.goto('/batch-testing');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('batch-testing.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression Tests - Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'wide', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`auth page - ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`auth-page-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual Regression Tests - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
  });

  test('auth page - dark mode', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('auth-page-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('not found page - dark mode', async ({ page }) => {
    await page.goto('/non-existent-route');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('not-found-page-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression Tests - Component States', () => {
  test('button hover states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Hover over the submit button
    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.hover();
      
      await expect(page).toHaveScreenshot('button-hover-state.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('form validation states', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Submit empty form to trigger validation
    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('form-validation-states.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });
});

test.describe('Visual Regression Tests - Accessibility Focus', () => {
  test('keyboard navigation visibility', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    await expect(page).toHaveScreenshot('keyboard-focus-visibility.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('high contrast mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('high-contrast-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
