# PromptLab

[![CI/CD Pipeline](https://github.com/USERNAME/REPO/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/USERNAME/REPO/actions)
[![Coverage](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)
[![E2E Tests](https://img.shields.io/badge/e2e-playwright-green.svg)](https://playwright.dev/)
[![Storybook](https://img.shields.io/badge/storybook-deployed-ff69b4.svg)](https://[username].github.io/[repo]/)

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b0399bf8-e997-477c-b799-40406ae8332e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b0399bf8-e997-477c-b799-40406ae8332e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Automatic Deployments

This project uses GitHub Actions for automated deployments:

#### Preview Environments
- **Trigger**: Automatically on every pull request
- **Purpose**: Test features before merging to main
- **URL Format**: `https://[username].github.io/[repo]/preview/pr-[number]/`
- **Quality Gates**: Automated smoke tests verify critical functionality
- **How to Use**: 
  1. Create a pull request
  2. Wait for preview deployment (2-3 minutes)
  3. Smoke tests run automatically
  4. Check PR comments for preview URL and test results
  5. Share URL for review and testing
  6. **Merge blocked until smoke tests pass**
- **Cleanup**: Automatic when PR is closed/merged

**Smoke Tests Verify:**
- Preview environment loads successfully
- No critical console errors
- Authentication page is accessible
- Main application elements render
- No network errors for critical resources

#### Production Deployment
- **Trigger**: Automatically when all tests pass on `main` branch
- **Prerequisites**: CI pipeline must succeed (lint, tests, build)
- **URL**: Your GitHub Pages URL or custom domain
- **Process**: Merge PR → Tests pass → Auto-deploy

#### Storybook Documentation
- **Trigger**: Automatically on push to `main`
- **Purpose**: Component documentation and visual testing
- **URL**: `https://[username].github.io/[repo]/`

### Manual Deployment via Lovable

Simply open [Lovable](https://lovable.dev/projects/b0399bf8-e997-477c-b799-40406ae8332e) and click on Share → Publish.

See [CI/CD Documentation](./docs/CI-CD.md) for detailed deployment information.

## 🧪 Testing

Comprehensive testing suite with multiple layers:

### Unit & Integration Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:ui          # Visual test UI
npm run test:coverage    # Generate coverage report
npm run test:run         # Run once (CI mode)
```

### End-to-End Tests
```bash
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # E2E test UI
npm run test:e2e:headed  # Run with browser visible
npm run test:e2e:debug   # Debug mode
npm run test:e2e:report  # View test report
```

### Visual Regression Tests
```bash
npm run chromatic        # Run Chromatic visual tests
npx playwright test e2e/visual  # Playwright visual tests
```

**Coverage Requirements:**
- Overall: 80%
- Per file: 70%
- Functions: 80%
- Branches: 75%

See [Testing Documentation](./docs/TESTING.md) and [CI/CD Documentation](./docs/CI-CD.md) for more details.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
