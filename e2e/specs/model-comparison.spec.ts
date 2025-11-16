import { test, expect } from '@playwright/test';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Model Comparison Flow', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
  });

  test('should navigate to model comparison page', async ({ page }) => {
    await page.goto('/model-comparison');
    
    await expect(page).toHaveURL('/model-comparison');
    await expect(page.locator('h1', { hasText: /model comparison/i })).toBeVisible();
  });

  test('should select multiple models for comparison', async ({ page }) => {
    await page.goto('/model-comparison');
    
    // Select models
    const modelCheckboxes = page.locator('input[type="checkbox"][name*="model"]');
    const count = await modelCheckboxes.count();
    
    if (count >= 2) {
      await modelCheckboxes.nth(0).check();
      await modelCheckboxes.nth(1).check();
      
      await expect(modelCheckboxes.nth(0)).toBeChecked();
      await expect(modelCheckboxes.nth(1)).toBeChecked();
    }
  });

  test('should run model comparison', async ({ page }) => {
    await page.goto('/model-comparison');
    
    // Fill prompt
    const promptInput = page.locator('textarea').first();
    await promptInput.fill('Explain quantum computing in simple terms');
    
    // Select at least one model
    const firstModelCheckbox = page.locator('input[type="checkbox"][name*="model"]').first();
    await firstModelCheckbox.check();
    
    // Run comparison
    const runButton = page.locator('button', { hasText: /run|compare/i });
    await runButton.click();
    
    // Should show results
    await expect(page.locator('text=/result|response|output/i')).toBeVisible({ timeout: 30000 });
  });

  test('should display cost and latency metrics', async ({ page }) => {
    await page.goto('/model-comparison');
    
    // Check if metrics are displayed on the page
    const hasMetrics = await page.locator('text=/cost|latency|tokens/i').count() > 0;
    expect(hasMetrics).toBeTruthy();
  });
});
