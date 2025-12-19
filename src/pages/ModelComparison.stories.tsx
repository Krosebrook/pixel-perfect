import type { Meta, StoryObj } from '@storybook/react';
import ModelComparison from './ModelComparison';
import { withProviders, withAuth } from '../../.storybook/decorators';

/**
 * ModelComparison page allows users to compare responses from multiple AI models side-by-side.
 * 
 * ## Accessibility Features
 * - **Keyboard Navigation**: Full keyboard support for all interactive elements
 * - **ARIA Labels**: Descriptive labels for model selectors and comparison results
 * - **Focus Management**: Focus is properly managed between comparison panels
 * - **Live Regions**: Results are announced to screen readers when they arrive
 * - **Responsive Design**: Adapts layout for different screen sizes
 * - **Semantic HTML**: Uses proper heading structure and landmark regions
 */
const meta: Meta<typeof ModelComparison> = {
  title: 'Pages/ModelComparison',
  component: ModelComparison,
  decorators: [withAuth, withProviders],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'heading-order', enabled: true },
        ],
      },
    },
    docs: {
      description: {
        component: `
## Keyboard Shortcuts
- \`Tab\`: Navigate between panels and controls
- \`Enter\`: Submit prompt, select models
- \`Escape\`: Clear selection, close dialogs
- \`Ctrl/Cmd + Enter\`: Quick submit prompt

## Screen Reader Announcements
- Model selection changes are announced
- Comparison results are announced when loaded
- Error states are communicated via aria-live regions
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModelComparison>;

const mockModels = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable OpenAI model' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most powerful Claude model' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
  { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s advanced model' },
];

export const Default: Story = {
  parameters: {
    mockData: {
      models: mockModels,
      selectedModels: [],
      results: null,
    },
  },
};

export const ModelsSelected: Story = {
  parameters: {
    mockData: {
      models: mockModels,
      selectedModels: ['gpt-4', 'claude-3-opus'],
      results: null,
    },
  },
};

export const WithResults: Story = {
  parameters: {
    mockData: {
      models: mockModels,
      selectedModels: ['gpt-4', 'claude-3-opus'],
      prompt: 'Explain quantum computing in simple terms',
      results: {
        'gpt-4': {
          content: 'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits that are either 0 or 1. This allows quantum computers to process many possibilities at once, making them potentially much faster for certain problems like cryptography and drug discovery.',
          latency_ms: 1850,
          cost: 0.012,
          tokens: { input: 25, output: 78 },
        },
        'claude-3-opus': {
          content: 'Think of quantum computing like a maze. A regular computer checks one path at a time. A quantum computer can explore all paths simultaneously thanks to special quantum properties called superposition and entanglement. This makes it incredibly powerful for solving complex problems.',
          latency_ms: 2100,
          cost: 0.015,
          tokens: { input: 25, output: 65 },
        },
      },
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      models: mockModels,
      selectedModels: ['gpt-4', 'claude-3-opus'],
      isLoading: true,
    },
  },
};

export const StreamingResponse: Story = {
  parameters: {
    mockData: {
      models: mockModels,
      selectedModels: ['gpt-4'],
      isStreaming: true,
      partialResults: {
        'gpt-4': {
          content: 'Quantum computing uses quantum bits...',
          isStreaming: true,
        },
      },
    },
    docs: {
      description: {
        story: 'Shows the streaming response state with progressive text updates.',
      },
    },
  },
};

export const WithError: Story = {
  parameters: {
    mockData: {
      models: mockModels,
      selectedModels: ['gpt-4', 'claude-3-opus'],
      results: {
        'gpt-4': {
          content: 'Response from GPT-4',
          latency_ms: 1200,
          cost: 0.01,
        },
        'claude-3-opus': {
          error: 'API rate limit exceeded. Please try again later.',
        },
      },
    },
    docs: {
      description: {
        story: 'Error states are visually distinct and announced to screen readers.',
      },
    },
  },
};

export const MaxModelsSelected: Story = {
  parameters: {
    mockData: {
      models: mockModels,
      selectedModels: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'gemini-pro'],
      results: null,
    },
    docs: {
      description: {
        story: 'Shows the maximum number of models that can be compared simultaneously.',
      },
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
        story: 'Mobile layout stacks comparison panels vertically for easier reading.',
      },
    },
  },
};

export const TabletView: Story = {
  ...WithResults,
  parameters: {
    ...WithResults.parameters,
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Demonstrates focus management between panels
 */
export const FocusManagement: Story = {
  ...WithResults,
  parameters: {
    ...WithResults.parameters,
    docs: {
      description: {
        story: `
Demonstrates proper focus management:
1. Tab cycles through model selector, prompt input, and submit button
2. After submission, focus moves to results area
3. Each result panel is focusable and has proper ARIA labels
4. Escape returns focus to the prompt input
        `,
      },
    },
  },
};
