import { test, expect } from '@playwright/test';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { DashboardPage } from '../fixtures/page-objects/dashboard-page';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Authentication Flow', () => {
  test('should display auth page', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await expect(page).toHaveTitle(/auth|login|sign in/i);
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.submitButton.click();
    
    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i')).toBeVisible();
  });

  test('should successfully sign in with valid credentials', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=/dashboard|home/i')).toBeVisible();
  });

  test('should maintain session after page reload', async ({ page, context }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL('/');
    await expect(page.locator('[role="button"]').filter({ hasText: /user/i })).toBeVisible();
  });

  test('should successfully log out', async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
    
    await dashboardPage.logout();
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should redirect to auth page when accessing protected route', async ({ page }) => {
    await page.goto('/analytics');
    
    // Should redirect to auth
    await expect(page).toHaveURL('/auth');
  });

  test('should switch between sign in and sign up tabs', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.signUpTab.click();
    await expect(authPage.displayNameInput).toBeVisible();
    
    await authPage.signInTab.click();
    await expect(authPage.displayNameInput).not.toBeVisible();
  });
});
