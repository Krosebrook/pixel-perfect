import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Authentication Page
 */
export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly displayNameInput: Locator;
  readonly submitButton: Locator;
  readonly signUpTab: Locator;
  readonly signInTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.displayNameInput = page.locator('input[name="displayName"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.signUpTab = page.locator('button[role="tab"]', { hasText: 'Sign Up' });
    this.signInTab = page.locator('button[role="tab"]', { hasText: 'Sign In' });
  }

  async goto() {
    await this.page.goto('/auth');
  }

  async signIn(email: string, password: string) {
    await this.signInTab.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signUp(email: string, password: string, displayName?: string) {
    await this.signUpTab.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (displayName) {
      await this.displayNameInput.fill(displayName);
    }
    await this.submitButton.click();
  }

  async waitForDashboard() {
    await this.page.waitForURL('/');
  }

  async waitForAuthPage() {
    await this.page.waitForURL('/auth');
  }
}
