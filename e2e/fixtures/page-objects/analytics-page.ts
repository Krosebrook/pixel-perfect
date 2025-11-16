import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Analytics Page
 */
export class AnalyticsPage {
  readonly page: Page;
  readonly timeRangeSelect: Locator;
  readonly usageChart: Locator;
  readonly costSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.timeRangeSelect = page.locator('select[name="timeRange"]');
    this.usageChart = page.locator('[data-testid="usage-chart"]');
    this.costSummary = page.locator('[data-testid="cost-summary"]');
  }

  async goto() {
    await this.page.goto('/analytics');
  }

  async selectTimeRange(range: '7d' | '30d' | '90d') {
    await this.timeRangeSelect.selectOption(range);
  }

  async waitForChartLoad() {
    await this.usageChart.waitFor({ state: 'visible' });
  }

  async getCostValue() {
    return this.costSummary.textContent();
  }
}
