import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Dashboard/Home Page
 */
export class DashboardPage {
  readonly page: Page;
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.promptInput = page.locator('textarea[placeholder*="prompt"]').first();
    this.generateButton = page.locator('button', { hasText: /generate|create/i }).first();
    this.userMenu = page.locator('[role="button"]').filter({ hasText: /user|account/i });
    this.logoutButton = page.locator('text=Sign Out');
  }

  async goto() {
    await this.page.goto('/');
  }

  async createPrompt(promptText: string) {
    await this.promptInput.fill(promptText);
    await this.generateButton.click();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async waitForResults() {
    await this.page.waitForSelector('[data-testid="prompt-output"]', { timeout: 30000 });
  }
}
