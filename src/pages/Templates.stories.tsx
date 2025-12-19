import type { Meta, StoryObj } from '@storybook/react';
import Templates from './Templates';
import { withProviders, withAuth } from '../../.storybook/decorators';

/**
 * Templates page provides a library of reusable prompt templates.
 * 
 * ## Accessibility Features
 * - **Keyboard Navigation**: Navigate templates using Tab and Arrow keys
 * - **Search**: Search field is properly labeled and announces results
 * - **Grid Navigation**: Template grid supports arrow key navigation
 * - **Preview Dialogs**: Focus is trapped within preview dialogs
 * - **ARIA Live Regions**: Search results and selections are announced
 * - **Responsive Cards**: Template cards adapt to screen size
 */
const meta: Meta<typeof Templates> = {
  title: 'Pages/Templates',
  component: Templates,
  decorators: [withAuth, withProviders],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'image-alt', enabled: true },
        ],
      },
    },
    docs: {
      description: {
        component: `
## Keyboard Shortcuts
- \`Tab\`: Navigate between search, filters, and templates
- \`Arrow Keys\`: Navigate within template grid
- \`Enter\`: Select template, open preview
- \`Escape\`: Close preview dialog
- \`/\`: Focus search field (global shortcut)

## Template Cards
- Each card is focusable and has a clear focus indicator
- Card content is read in logical order by screen readers
- Use/Preview buttons have descriptive labels
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Templates>;

const mockTemplates = [
  {
    id: '1',
    name: 'Code Review Assistant',
    description: 'Comprehensive code review with best practices, security, and performance analysis',
    category_id: 'development',
    difficulty_level: 'intermediate',
    use_count: 1250,
    tags: ['code', 'review', 'security'],
    template_content: 'Review the following code:\n\n{{code}}\n\nProvide feedback on:\n1. Code quality\n2. Security issues\n3. Performance optimizations',
    is_system: true,
  },
  {
    id: '2',
    name: 'Technical Documentation',
    description: 'Generate clear technical documentation for APIs, functions, or systems',
    category_id: 'documentation',
    difficulty_level: 'beginner',
    use_count: 890,
    tags: ['docs', 'api', 'technical'],
    template_content: 'Write documentation for:\n\n{{subject}}\n\nInclude:\n- Overview\n- Parameters\n- Examples\n- Error handling',
    is_system: true,
  },
  {
    id: '3',
    name: 'SQL Query Optimizer',
    description: 'Analyze and optimize SQL queries for better performance',
    category_id: 'database',
    difficulty_level: 'advanced',
    use_count: 567,
    tags: ['sql', 'database', 'optimization'],
    template_content: 'Optimize this SQL query:\n\n{{query}}\n\nConsider:\n- Index usage\n- Query plan\n- Execution time',
    is_system: true,
  },
  {
    id: '4',
    name: 'User Story Writer',
    description: 'Create user stories following agile methodology standards',
    category_id: 'product',
    difficulty_level: 'beginner',
    use_count: 432,
    tags: ['agile', 'user-story', 'product'],
    template_content: 'Create user stories for:\n\n{{feature}}\n\nFormat:\nAs a {{user_type}}, I want to {{action}}, so that {{benefit}}',
    is_system: true,
  },
];

const mockCategories = [
  { id: 'development', name: 'Development', icon: 'code', slug: 'development' },
  { id: 'documentation', name: 'Documentation', icon: 'book', slug: 'documentation' },
  { id: 'database', name: 'Database', icon: 'database', slug: 'database' },
  { id: 'product', name: 'Product', icon: 'package', slug: 'product' },
];

export const Default: Story = {
  parameters: {
    mockData: {
      templates: mockTemplates,
      categories: mockCategories,
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      templates: null,
      categories: null,
      isLoading: true,
    },
  },
};

export const EmptyState: Story = {
  parameters: {
    mockData: {
      templates: [],
      categories: mockCategories,
    },
    docs: {
      description: {
        story: 'Empty state with clear guidance on how to create templates.',
      },
    },
  },
};

export const FilteredByCategory: Story = {
  parameters: {
    mockData: {
      templates: mockTemplates.filter(t => t.category_id === 'development'),
      categories: mockCategories,
      activeCategory: 'development',
    },
  },
};

export const SearchResults: Story = {
  parameters: {
    mockData: {
      templates: mockTemplates.filter(t => t.name.toLowerCase().includes('code')),
      categories: mockCategories,
      searchQuery: 'code',
    },
    docs: {
      description: {
        story: 'Search results are announced to screen readers via aria-live region.',
      },
    },
  },
};

export const NoSearchResults: Story = {
  parameters: {
    mockData: {
      templates: [],
      categories: mockCategories,
      searchQuery: 'nonexistent template query',
    },
    docs: {
      description: {
        story: 'No results state with helpful suggestions.',
      },
    },
  },
};

export const WithCustomTemplates: Story = {
  parameters: {
    mockData: {
      templates: [
        ...mockTemplates,
        {
          id: 'custom-1',
          name: 'My Custom Template',
          description: 'A custom template I created',
          category_id: 'development',
          difficulty_level: 'intermediate',
          use_count: 15,
          tags: ['custom'],
          template_content: 'Custom template content...',
          is_system: false,
          created_by: 'user-1',
        },
      ],
      categories: mockCategories,
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
        story: 'Mobile layout with single-column template cards and touch-friendly interactions.',
      },
    },
  },
};

export const TabletView: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const DarkMode: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    theme: 'dark',
    docs: {
      description: {
        story: 'Dark mode with proper contrast and focus indicators.',
      },
    },
  },
};

/**
 * Story demonstrating grid navigation
 */
export const GridNavigation: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    docs: {
      description: {
        story: `
Demonstrates arrow key navigation within the template grid:
1. Tab to the template grid
2. Use Arrow keys to move between templates
3. Press Enter to select/preview a template
4. Press Escape to deselect
        `,
      },
    },
  },
};

/**
 * Story demonstrating preview dialog accessibility
 */
export const PreviewDialogAccessibility: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    docs: {
      description: {
        story: `
Template preview dialog features:
- Focus is trapped within the dialog
- Escape key closes the dialog
- Focus returns to the trigger button on close
- All content is accessible via keyboard
- Dialog has proper ARIA attributes
        `,
      },
    },
  },
};
