import { test, expect } from '@playwright/test';
import { AuthPage } from '../fixtures/page-objects/auth-page';
import { DashboardPage } from '../fixtures/page-objects/dashboard-page';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Prompt Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.signIn(TEST_USERS.validUser.email, TEST_USERS.validUser.password);
    await authPage.waitForDashboard();
  });

  test('should display prompt creation form', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    await expect(dashboardPage.promptInput).toBeVisible();
    await expect(dashboardPage.generateButton).toBeVisible();
  });

  test('should create a basic prompt', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    const promptText = 'Write a creative short story about a robot learning to paint';
    await dashboardPage.createPrompt(promptText);
    
    // Should show loading state
    await expect(page.locator('text=/generating|loading/i')).toBeVisible();
  });

  test('should save prompt to favorites', async ({ page }) => {
    await page.goto('/');
    
    // Create a prompt first
    await page.locator('textarea').first().fill('Test prompt for favorites');
    await page.locator('button', { hasText: /generate/i }).first().click();
    
    // Wait for results
    await page.waitForSelector('[data-testid="prompt-output"]', { timeout: 30000 });
    
    // Save to favorites
    const favoriteButton = page.locator('[aria-label*="favorite"]').first();
    await favoriteButton.click();
    
    await expect(page.locator('text=/saved|added to favorites/i')).toBeVisible();
  });

  test('should navigate to prompts library', async ({ page }) => {
    await page.goto('/prompts');
    
    await expect(page).toHaveURL('/prompts');
    await expect(page.locator('h1', { hasText: /prompts/i })).toBeVisible();
  });
});
