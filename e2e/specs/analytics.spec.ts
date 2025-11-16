import { test, expect } from '@playwright/test';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { AnalyticsPage } from '../fixtures/page-objects/analytics-page';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Analytics Flow', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
  });

  test('should navigate to analytics page', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();
    
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('h1', { hasText: /analytics/i })).toBeVisible();
  });

  test('should display usage statistics', async ({ page }) => {
    await page.goto('/analytics');
    
    // Check for common analytics elements
    const hasAnalytics = await page.locator('text=/usage|cost|tokens|requests/i').count() > 0;
    expect(hasAnalytics).toBeTruthy();
  });

  test('should display rate limit information', async ({ page }) => {
    await page.goto('/analytics');
    
    // Look for rate limit indicators
    const hasRateLimit = await page.locator('text=/rate limit|requests per|calls per/i').count() > 0;
    expect(hasRateLimit).toBeTruthy();
  });

  test('should allow filtering by time range', async ({ page }) => {
    await page.goto('/analytics');
    
    // Look for time range selector
    const timeRangeSelector = page.locator('select, button').filter({ hasText: /7 days|30 days|week|month/i });
    const hasTimeRange = await timeRangeSelector.count() > 0;
    
    expect(hasTimeRange).toBeTruthy();
  });

  test('should display cost tracking', async ({ page }) => {
    await page.goto('/analytics');
    
    // Look for cost information
    const hasCost = await page.locator('text=/cost|\$|budget|spending/i').count() > 0;
    expect(hasCost).toBeTruthy();
  });
});
