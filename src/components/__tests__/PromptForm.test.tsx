import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { PromptForm } from '../PromptForm';

describe('PromptForm', () => {
  const mockOnGenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the form with title and description', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      expect(screen.getByText('Universal Prompt Generator')).toBeInTheDocument();
      expect(
        screen.getByText(/Configure your prompt specifications to generate production-grade prompts/i)
      ).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      expect(screen.getByLabelText(/Goal Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Problem Definition/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Precision Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Model Target/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Output Format/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Success Criteria/i)).toBeInTheDocument();
    });

    it('should render optional fields', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      expect(screen.getByLabelText(/Response Depth/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Voice & Style/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Technical Environment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Constraints/i)).toBeInTheDocument();
    });

    it('should have default values set', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      // Check default select values by looking at the trigger text
      expect(screen.getByText('Writing')).toBeInTheDocument();
      expect(screen.getByText('GPT')).toBeInTheDocument();
      expect(screen.getByText('Markdown')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for short problem definition', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const problemInput = screen.getByLabelText(/Problem Definition/i);
      await user.type(problemInput, 'Short');

      const successInput = screen.getByLabelText(/Success Criteria/i);
      await user.type(successInput, 'Valid success criteria text');

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Problem definition must be at least 10 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('should show validation error for short success criteria', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const problemInput = screen.getByLabelText(/Problem Definition/i);
      await user.type(problemInput, 'Valid problem definition text');

      const successInput = screen.getByLabelText(/Success Criteria/i);
      await user.type(successInput, 'Short');

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Success criteria must be at least 10 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('should not submit form with empty required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Problem definition must be at least 10 characters/i)).toBeInTheDocument();
      });

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call onGenerate with correct data on valid submission', async () => {
      const user = userEvent.setup();
      mockOnGenerate.mockResolvedValue(undefined);

      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const problemInput = screen.getByLabelText(/Problem Definition/i);
      await user.type(problemInput, 'Create a user authentication system');

      const successInput = screen.getByLabelText(/Success Criteria/i);
      await user.type(successInput, 'Secure login with JWT tokens');

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            goal_type: 'writing',
            problem: 'Create a user authentication system',
            success_criteria: 'Secure login with JWT tokens',
            precision: 'A1',
            model_target: 'gpt',
            format: 'markdown',
            depth: 'medium',
          })
        );
      });
    });

    it('should include optional fields in submission', async () => {
      const user = userEvent.setup();
      mockOnGenerate.mockResolvedValue(undefined);

      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const problemInput = screen.getByLabelText(/Problem Definition/i);
      await user.type(problemInput, 'Create a user authentication system');

      const successInput = screen.getByLabelText(/Success Criteria/i);
      await user.type(successInput, 'Secure login with JWT tokens');

      const voiceInput = screen.getByLabelText(/Voice & Style/i);
      await user.type(voiceInput, 'Professional and concise');

      const techInput = screen.getByLabelText(/Technical Environment/i);
      await user.type(techInput, 'Node.js with Express');

      const constraintsInput = screen.getByLabelText(/Constraints/i);
      await user.type(constraintsInput, 'Must use TypeScript');

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            voice_style: 'Professional and concise',
            tech_env: 'Node.js with Express',
            constraints: 'Must use TypeScript',
          })
        );
      });
    });

    it('should handle API errors and display them', async () => {
      const user = userEvent.setup();
      const mockError = {
        errors: [{ message: 'API rate limit exceeded' }],
      };
      mockOnGenerate.mockRejectedValue(mockError);

      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const problemInput = screen.getByLabelText(/Problem Definition/i);
      await user.type(problemInput, 'Create a user authentication system');

      const successInput = screen.getByLabelText(/Success Criteria/i);
      await user.type(successInput, 'Secure login with JWT tokens');

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable submit button when isGenerating is true', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={true} />);

      const submitButton = screen.getByRole('button', { name: /Generating.../i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading spinner when isGenerating is true', () => {
      const { container } = renderWithProviders(
        <PromptForm onGenerate={mockOnGenerate} isGenerating={true} />
      );

      // Check for Loader2 icon (lucide-react)
      const loader = container.querySelector('svg.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should enable submit button when isGenerating is false', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Select Field Interactions', () => {
    it('should allow changing goal type', async () => {
      const user = userEvent.setup();
      mockOnGenerate.mockResolvedValue(undefined);

      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      // Click the Goal Type select
      const goalTypeSelect = screen.getByLabelText(/Goal Type/i);
      await user.click(goalTypeSelect);

      // Select "Coding"
      const codingOption = screen.getByRole('option', { name: /Coding/i });
      await user.click(codingOption);

      // Fill required fields
      const problemInput = screen.getByLabelText(/Problem Definition/i);
      await user.type(problemInput, 'Create a REST API endpoint');

      const successInput = screen.getByLabelText(/Success Criteria/i);
      await user.type(successInput, 'Return JSON response with proper error handling');

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            goal_type: 'coding',
          })
        );
      });
    });

    it('should allow changing precision level', async () => {
      const user = userEvent.setup();
      mockOnGenerate.mockResolvedValue(undefined);

      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      // Click the Precision Level select
      const precisionSelect = screen.getByLabelText(/Precision Level/i);
      await user.click(precisionSelect);

      // Select "S_TIER"
      const sTierOption = screen.getByRole('option', { name: /S-Tier/i });
      await user.click(sTierOption);

      // Fill required fields
      const problemInput = screen.getByLabelText(/Problem Definition/i);
      await user.type(problemInput, 'Complex analysis task');

      const successInput = screen.getByLabelText(/Success Criteria/i);
      await user.type(successInput, 'Detailed comprehensive output');

      const submitButton = screen.getByRole('button', { name: /Generate Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            precision: 'S_TIER',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      expect(screen.getByLabelText(/Goal Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Problem Definition/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Precision Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Model Target/i)).toBeInTheDocument();
    });

    it('should have descriptive help text', () => {
      renderWithProviders(<PromptForm onGenerate={mockOnGenerate} isGenerating={false} />);

      expect(
        screen.getByText(/Define the core task or question you want the LLM to address/i)
      ).toBeInTheDocument();
    });
  });
});
