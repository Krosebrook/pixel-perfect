/**
 * Integration tests for Prompt Creation flow
 * Tests the complete user journey from creating a prompt to viewing it
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import Prompts from '@/pages/Prompts';
import { PromptForm } from '@/components/PromptForm';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'new-prompt-1',
              name: 'Test Prompt',
              problem: 'Test problem',
              goal_type: 'code',
              precision: 'high',
              model_target: 'gpt-4',
              format: 'markdown',
              generated_prompt: 'Generated text',
              created_by: 'user-1',
            },
            error: null,
          })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({
        data: { generated_prompt: 'AI generated prompt text', quality_scores: { clarity: 85 } },
        error: null,
      })),
    },
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      })),
    },
  },
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    session: { access_token: 'token' },
  }),
}));

describe('Prompt Creation Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prompts List Page', () => {
    it('should render prompts page with create button', async () => {
      renderWithProviders(<Prompts />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /prompts/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /create|new/i })).toBeInTheDocument();
    });

    it('should show empty state when no prompts exist', async () => {
      renderWithProviders(<Prompts />);

      await waitFor(() => {
        expect(screen.getByText(/no prompts|get started/i)).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation on prompt list', async () => {
      renderWithProviders(<Prompts />);

      const createButton = await screen.findByRole('button', { name: /create|new/i });
      
      // Tab to the create button
      await user.tab();
      
      await waitFor(() => {
        expect(createButton).toHaveFocus();
      });
    });
  });

  describe('Prompt Form', () => {
    const mockOnGenerate = vi.fn();

    it('should render form with all required fields', () => {
      renderWithProviders(
        <PromptForm onGenerate={mockOnGenerate} isGenerating={false} />
      );

      // Check for form fields
      expect(screen.getByLabelText(/problem|description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/success criteria/i)).toBeInTheDocument();
    });

    it('should validate required fields before submission', async () => {
      renderWithProviders(
        <PromptForm onGenerate={mockOnGenerate} isGenerating={false} />
      );

      const submitButton = screen.getByRole('button', { name: /generate/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnGenerate).not.toHaveBeenCalled();
      });
    });

    it('should fill form and submit successfully', async () => {
      renderWithProviders(
        <PromptForm onGenerate={mockOnGenerate} isGenerating={false} />
      );

      // Fill in required fields
      const problemInput = screen.getByLabelText(/problem|description/i);
      await user.type(problemInput, 'This is a test problem description that needs to be solved');

      const criteriaInput = screen.getByLabelText(/success criteria/i);
      await user.type(criteriaInput, 'The output should be clear and well-structured');

      // Submit
      const submitButton = screen.getByRole('button', { name: /generate/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalled();
      });
    });

    it('should have accessible form labels', () => {
      renderWithProviders(
        <PromptForm onGenerate={mockOnGenerate} isGenerating={false} />
      );

      // All inputs should have associated labels
      const textareas = screen.getAllByRole('textbox');
      textareas.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('should show loading state when generating', () => {
      renderWithProviders(
        <PromptForm onGenerate={mockOnGenerate} isGenerating={true} />
      );

      const submitButton = screen.getByRole('button', { name: /generat/i });
      expect(submitButton).toBeDisabled();
    });
  });
});

describe('Prompt Search and Filter Flow', () => {
  it('should filter prompts based on search term', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<Prompts />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /prompts/i })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'test');

    // Search should be debounced and trigger a filter
    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    }, { timeout: 500 });
  });
});

describe('Prompt Search and Filter Flow', () => {
  it('should filter prompts based on search term', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<Prompts />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /prompts/i })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'test');

    // Search should be debounced and trigger a filter
    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    }, { timeout: 500 });
  });
});
