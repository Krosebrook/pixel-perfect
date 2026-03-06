/**
 * Demo/sample data for the Prompts page when no database content is available
 */

export interface DemoPrompt {
  id: string;
  problem: string;
  description: string | null;
  visibility: string | null;
  created_at: string | null;
  created_by: string;
  use_count: number | null;
  is_featured: boolean | null;
  prompt_categories?: { name: string; icon: string | null } | null;
  profiles?: { display_name: string | null } | null;
}

export const DEMO_PROMPTS: DemoPrompt[] = [
  {
    id: 'demo-1',
    problem: 'Build a REST API with Express and TypeScript',
    description: 'Generate a production-ready REST API boilerplate with authentication, validation, and error handling.',
    visibility: 'public',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_by: 'demo',
    use_count: 142,
    is_featured: true,
    prompt_categories: { name: 'Code Generation', icon: '💻' },
    profiles: { display_name: 'Alex Chen' },
  },
  {
    id: 'demo-2',
    problem: 'Write a technical blog post about microservices',
    description: 'Create an in-depth article explaining microservice architecture patterns with real-world examples.',
    visibility: 'public',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_by: 'demo',
    use_count: 89,
    is_featured: true,
    prompt_categories: { name: 'Writing', icon: '✍️' },
    profiles: { display_name: 'Sarah Kim' },
  },
  {
    id: 'demo-3',
    problem: 'Analyze sales data and generate insights',
    description: 'Process a CSV dataset of quarterly sales and produce actionable business intelligence with visualizations.',
    visibility: 'public',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_by: 'demo',
    use_count: 67,
    is_featured: false,
    prompt_categories: { name: 'Data Analysis', icon: '📊' },
    profiles: { display_name: 'Jordan Lee' },
  },
  {
    id: 'demo-4',
    problem: 'Design a mobile-first dashboard layout',
    description: 'Create a responsive dashboard wireframe with charts, KPI cards, and navigation optimized for mobile devices.',
    visibility: 'public',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_by: 'demo',
    use_count: 55,
    is_featured: false,
    prompt_categories: { name: 'Design', icon: '🎨' },
    profiles: { display_name: 'Maya Patel' },
  },
  {
    id: 'demo-5',
    problem: 'Set up a CI/CD pipeline with GitHub Actions',
    description: 'Generate a complete GitHub Actions workflow for building, testing, and deploying a Node.js app to AWS.',
    visibility: 'public',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    created_by: 'demo',
    use_count: 203,
    is_featured: true,
    prompt_categories: { name: 'DevOps', icon: '⚙️' },
    profiles: { display_name: 'Dev Team' },
  },
  {
    id: 'demo-6',
    problem: 'Generate unit tests for a React component',
    description: 'Write comprehensive unit tests using Vitest and Testing Library for a complex form component.',
    visibility: 'public',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    created_by: 'demo',
    use_count: 118,
    is_featured: false,
    prompt_categories: { name: 'Code Generation', icon: '💻' },
    profiles: { display_name: 'Alex Chen' },
  },
];
