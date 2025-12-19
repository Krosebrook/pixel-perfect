# Visual Regression Testing Guide

This project uses multiple visual regression testing strategies to catch unintended UI changes.

## Testing Strategies

### 1. Chromatic (Storybook-based)

Chromatic provides visual testing for all Storybook stories, automatically detecting visual changes in components.

#### Setup

1. Create an account at [chromatic.com](https://www.chromatic.com/)
2. Get your project token from the Chromatic dashboard
3. Add `CHROMATIC_PROJECT_TOKEN` to your GitHub repository secrets

#### Usage

- **Automatic**: Runs on every push to `main`/`develop` and on PRs
- **Manual**: Run `npx chromatic --project-token=<token>` locally

#### Features

- Component-level visual diffing
- Automatic baseline management
- UI Review workflow for approving changes
- Integration with PR checks

### 2. Playwright Visual Tests

Playwright provides page-level visual regression testing for full-page screenshots.

#### Local Development

```bash
# Run visual tests
npx playwright test e2e/visual/

# Update baseline screenshots
npx playwright test e2e/visual/ --update-snapshots

# View test report
npx playwright show-report
```

#### Test Categories

| Category | Description |
|----------|-------------|
| Public Pages | Auth, 404, landing pages |
| Authenticated Pages | Dashboard, analytics, settings |
| Responsive Design | Mobile, tablet, desktop, wide viewports |
| Dark Mode | All pages with dark theme |
| Component States | Hover, focus, validation states |
| Accessibility Focus | Keyboard navigation, high contrast |

### 3. Coverage Configuration

Visual tests are configured in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,      // Allow up to 100 pixel differences
    threshold: 0.2,          // 20% color difference threshold
  },
},
```

## CI/CD Integration

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Runs Playwright visual tests |
| `chromatic.yml` | Push/PR | Runs Chromatic visual tests |

### Artifacts

- **visual-regression-report**: Playwright screenshots and diffs
- **chromatic-build-log**: Chromatic build information (on failure)

## Best Practices

### Writing Visual Tests

1. **Disable animations**: Always use `animations: 'disabled'`
2. **Wait for stability**: Use `waitForLoadState('networkidle')`
3. **Mask dynamic content**: Hide timestamps, real-time data
4. **Test multiple viewports**: Include mobile, tablet, desktop

### Example Test

```typescript
test('dashboard - main view', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('dashboard-main.png', {
    fullPage: true,
    animations: 'disabled',
    mask: [
      page.locator('.timestamp'),
      page.locator('[data-testid="real-time-data"]'),
    ],
  });
});
```

### Handling Flaky Tests

1. **Increase timeout**: Add explicit waits for async content
2. **Mask dynamic areas**: Use `mask` option for changing content
3. **Increase thresholds**: Adjust `maxDiffPixels` for minor variations

## Reviewing Changes

### Chromatic Review

1. Open the Chromatic build link from PR checks
2. Review each changed component
3. Accept or deny changes
4. Changes are automatically baselined when merged

### Playwright Review

1. Download the `visual-regression-report` artifact
2. Open `playwright-report/index.html`
3. Compare actual vs expected screenshots
4. Update baselines locally if changes are intentional

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Font rendering differences | Use consistent fonts in CI |
| Animation timing | Disable animations in tests |
| Dynamic content | Mask with `mask` option |
| Viewport differences | Set explicit viewport sizes |

### Debug Commands

```bash
# Run with headed browser
npx playwright test e2e/visual/ --headed

# Run specific test
npx playwright test e2e/visual/ -g "auth page"

# Debug mode
npx playwright test e2e/visual/ --debug
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CHROMATIC_PROJECT_TOKEN` | Yes (CI) | Chromatic authentication |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Visual Testing](https://storybook.js.org/docs/writing-tests/visual-testing)
