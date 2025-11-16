import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Prompts Page
 */
export class PromptsPage {
  readonly page: Page;
  readonly createPromptButton: Locator;
  readonly promptsList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createPromptButton = page.locator('button', { hasText: /create|new prompt/i });
    this.promptsList = page.locator('[data-testid="prompts-list"]');
    this.searchInput = page.locator('input[type="search"]');
  }

  async goto() {
    await this.page.goto('/prompts');
  }

  async createNewPrompt() {
    await this.createPromptButton.click();
  }

  async searchPrompts(query: string) {
    await this.searchInput.fill(query);
  }

  async getPromptByName(name: string) {
    return this.page.locator(`text=${name}`);
  }

  async deletePrompt(name: string) {
    const prompt = await this.getPromptByName(name);
    await prompt.hover();
    await this.page.locator('[aria-label="Delete prompt"]').click();
    await this.page.locator('button', { hasText: /confirm|delete/i }).click();
  }
}
