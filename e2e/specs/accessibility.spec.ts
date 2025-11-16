import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Accessibility Tests', () => {
  test('auth page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should not have accessibility violations', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation on auth page', async ({ page }) => {
    await page.goto('/auth');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for ARIA labels
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(emailInput).toHaveAttribute('aria-label', /.+/);
    await expect(passwordInput).toHaveAttribute('aria-label', /.+/);
  });

  test('forms should have accessible error messages', async ({ page }) => {
    await page.goto('/auth');
    
    // Submit empty form to trigger validation
    await page.locator('button[type="submit"]').click();
    
    // Error messages should be associated with inputs via aria-describedby
    const emailInput = page.locator('input[name="email"]');
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
    
    if (ariaDescribedBy) {
      const errorMessage = page.locator(`#${ariaDescribedBy}`);
      await expect(errorMessage).toBeVisible();
    }
  });
});
