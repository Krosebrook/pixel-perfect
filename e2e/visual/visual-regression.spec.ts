import { test, expect } from '@playwright/test';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Visual Regression Tests', () => {
  test('auth page matches snapshot', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('auth-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('dashboard matches snapshot (authenticated)', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('.timestamp, [data-testid="real-time-data"]')],
    });
  });

  test('analytics page matches snapshot', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('analytics-page.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('[data-testid="chart"]')],
    });
  });

  test('model comparison page matches snapshot', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await page.goto('/model-comparison');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('model-comparison.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
