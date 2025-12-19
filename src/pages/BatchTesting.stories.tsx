import type { Meta, StoryObj } from '@storybook/react';
import BatchTesting from './BatchTesting';
import { withProviders, withAuth } from '../../.storybook/decorators';

/**
 * BatchTesting page allows users to run multiple prompts against multiple models simultaneously.
 * 
 * ## Accessibility Features
 * - **Keyboard Navigation**: All interactive elements are focusable and operable via keyboard
 * - **ARIA Labels**: Form fields and buttons have descriptive labels for screen readers
 * - **Focus Management**: Focus is properly managed when dialogs open/close
 * - **Status Announcements**: Test progress and results are announced to assistive technologies
 * - **Color Contrast**: All text meets WCAG 2.1 AA contrast requirements
 * - **Semantic Structure**: Uses proper heading hierarchy and landmark regions
 */
const meta: Meta<typeof BatchTesting> = {
  title: 'Pages/BatchTesting',
  component: BatchTesting,
  decorators: [withAuth, withProviders],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
    docs: {
      description: {
        component: `
## Keyboard Shortcuts
- \`Tab\`: Navigate between form fields and buttons
- \`Enter\`: Submit forms, activate buttons
- \`Escape\`: Close dialogs and cancel operations
- \`Arrow Keys\`: Navigate within dropdown menus and model selection

## Screen Reader Support
- Form fields announce their purpose and current value
- Error messages are associated with their respective inputs
- Test progress updates are announced via live regions
- Results table uses proper table semantics with headers
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BatchTesting>;

const mockPrompts = [
  { id: '1', name: 'Code Review Prompt', text: 'Review this code for best practices...' },
  { id: '2', name: 'Documentation Writer', text: 'Write documentation for the following API...' },
  { id: '3', name: 'Bug Analysis', text: 'Analyze this bug report and suggest fixes...' },
];

const mockModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
];

export const Default: Story = {
  parameters: {
    mockData: {
      prompts: mockPrompts,
      models: mockModels,
      testRuns: [],
    },
  },
};

export const WithPreviousRuns: Story = {
  parameters: {
    mockData: {
      prompts: mockPrompts,
      models: mockModels,
      testRuns: [
        {
          id: 'run-1',
          prompt_text: 'Test prompt 1',
          models: ['gpt-4', 'claude-3-opus'],
          created_at: '2024-01-15T10:00:00Z',
          total_cost: 0.25,
          total_latency_ms: 3500,
          responses: {
            'gpt-4': { content: 'Response from GPT-4', latency_ms: 1800, cost: 0.15 },
            'claude-3-opus': { content: 'Response from Claude', latency_ms: 1700, cost: 0.10 },
          },
        },
      ],
    },
  },
};

export const RunningTests: Story = {
  parameters: {
    mockData: {
      prompts: mockPrompts,
      models: mockModels,
      isRunning: true,
      progress: 60,
      testRuns: [],
    },
  },
};

export const WithErrors: Story = {
  parameters: {
    mockData: {
      prompts: mockPrompts,
      models: mockModels,
      testRuns: [
        {
          id: 'run-1',
          prompt_text: 'Test prompt with error',
          models: ['gpt-4'],
          created_at: '2024-01-15T10:00:00Z',
          total_cost: 0,
          total_latency_ms: 5000,
          responses: {
            'gpt-4': { error: 'Rate limit exceeded', latency_ms: 5000 },
          },
        },
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      prompts: null,
      models: null,
      isLoading: true,
    },
  },
};

export const EmptyState: Story = {
  parameters: {
    mockData: {
      prompts: [],
      models: mockModels,
      testRuns: [],
    },
  },
};

export const MobileView: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-responsive layout with stacked form fields and touch-friendly buttons.',
      },
    },
  },
};

export const HighContrastMode: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Demonstrates high contrast mode support for users with visual impairments.',
      },
    },
  },
};

/**
 * Story demonstrating keyboard-only navigation
 */
export const KeyboardNavigation: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    docs: {
      description: {
        story: `
This story demonstrates keyboard navigation support:
1. Press Tab to move between form elements
2. Use Arrow keys to navigate model selection
3. Press Enter to submit the batch test
4. Press Escape to cancel any open dialogs
        `,
      },
    },
  },
};
