import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { PromptOutput } from '../PromptOutput';
import type { GeneratedPrompt } from '@/types/prompt';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('PromptOutput', () => {
  const mockPrompt: GeneratedPrompt = {
    generated_prompt: 'This is a generated prompt for testing purposes.',
    spec: {
      goal_type: 'writing',
      problem: 'Create a comprehensive blog post about AI ethics',
      precision: 'A1',
      model_target: 'gpt',
      format: 'markdown',
      success_criteria: 'Clear, engaging content with proper structure',
      depth: 'medium',
      voice_style: 'Professional',
      tech_env: 'Web',
      constraints: 'Max 2000 words',
    },
    quality_scores: {
      structural_integrity: 0.85,
      ambiguity_score: 0.78,
      hallucination_risk: 0.92,
      cost_efficiency: 0.65,
      model_compatibility: 0.88,
      goal_alignment: 0.90,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('Rendering', () => {
    it('should render prompt title and description', () => {
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      expect(screen.getByText(mockPrompt.spec.problem)).toBeInTheDocument();
      expect(screen.getByText(/Generated for GPT • A1 Level/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    it('should render all tabs', () => {
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      expect(screen.getByRole('tab', { name: /Generated Prompt/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Quality Scores/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Specifications/i })).toBeInTheDocument();
    });

    it('should display generated prompt text by default', () => {
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      expect(
        screen.getByText('This is a generated prompt for testing purposes.')
      ).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should copy prompt to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPrompt.generated_prompt);
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  describe('Download Functionality', () => {
    it('should download prompt when download button is clicked', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      // Mock document methods
      const mockClick = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockAppendChild = vi.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const downloadButton = screen.getByRole('button', { name: /Download/i });
      await user.click(downloadButton);

      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Prompt downloaded!');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use correct filename format', async () => {
      const user = userEvent.setup();

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());

      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const downloadButton = screen.getByRole('button', { name: /Download/i });
      await user.click(downloadButton);

      expect(mockAnchor.download).toBe('prompt_writing_A1.txt');
    });
  });

  describe('Quality Scores Tab', () => {
    it('should display quality scores when tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const qualityTab = screen.getByRole('tab', { name: /Quality Scores/i });
      await user.click(qualityTab);

      await waitFor(() => {
        expect(screen.getByText('Structural Integrity')).toBeInTheDocument();
        expect(screen.getByText('Ambiguity Score')).toBeInTheDocument();
        expect(screen.getByText('Hallucination Risk')).toBeInTheDocument();
        expect(screen.getByText('Cost Efficiency')).toBeInTheDocument();
        expect(screen.getByText('Model Compatibility')).toBeInTheDocument();
        expect(screen.getByText('Goal Alignment')).toBeInTheDocument();
      });
    });

    it('should display score values as badges', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const qualityTab = screen.getByRole('tab', { name: /Quality Scores/i });
      await user.click(qualityTab);

      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('78%')).toBeInTheDocument();
        expect(screen.getByText('92%')).toBeInTheDocument();
        expect(screen.getByText('65%')).toBeInTheDocument();
        expect(screen.getByText('88%')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument();
      });
    });

    it('should show appropriate icons based on score', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const qualityTab = screen.getByRole('tab', { name: /Quality Scores/i });
      await user.click(qualityTab);

      await waitFor(() => {
        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('should handle missing quality scores', async () => {
      const user = userEvent.setup();
      const promptWithoutScores: GeneratedPrompt = {
        ...mockPrompt,
        quality_scores: null,
      };

      renderWithProviders(<PromptOutput prompt={promptWithoutScores} />);

      const qualityTab = screen.getByRole('tab', { name: /Quality Scores/i });
      await user.click(qualityTab);

      await waitFor(() => {
        expect(screen.getByText(/No quality scores available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Specifications Tab', () => {
    it('should display all specifications when tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const specsTab = screen.getByRole('tab', { name: /Specifications/i });
      await user.click(specsTab);

      await waitFor(() => {
        expect(screen.getByText('Goal Type')).toBeInTheDocument();
        expect(screen.getByText('writing')).toBeInTheDocument();
        expect(screen.getByText('Precision')).toBeInTheDocument();
        expect(screen.getByText('A1')).toBeInTheDocument();
        expect(screen.getByText('Model Target')).toBeInTheDocument();
        expect(screen.getByText('gpt')).toBeInTheDocument();
        expect(screen.getByText('Format')).toBeInTheDocument();
        expect(screen.getByText('markdown')).toBeInTheDocument();
      });
    });

    it('should display optional specifications', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const specsTab = screen.getByRole('tab', { name: /Specifications/i });
      await user.click(specsTab);

      await waitFor(() => {
        expect(screen.getByText('Depth')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('Voice Style')).toBeInTheDocument();
        expect(screen.getByText('Professional')).toBeInTheDocument();
        expect(screen.getByText('Tech Environment')).toBeInTheDocument();
        expect(screen.getByText('Web')).toBeInTheDocument();
        expect(screen.getByText('Constraints')).toBeInTheDocument();
        expect(screen.getByText('Max 2000 words')).toBeInTheDocument();
      });
    });

    it('should not display undefined optional fields', async () => {
      const user = userEvent.setup();
      const promptWithoutOptionals: GeneratedPrompt = {
        ...mockPrompt,
        spec: {
          ...mockPrompt.spec,
          depth: undefined,
          voice_style: undefined,
          tech_env: undefined,
          constraints: undefined,
        },
      };

      renderWithProviders(<PromptOutput prompt={promptWithoutOptionals} />);

      const specsTab = screen.getByRole('tab', { name: /Specifications/i });
      await user.click(specsTab);

      await waitFor(() => {
        expect(screen.queryByText('Depth')).not.toBeInTheDocument();
        expect(screen.queryByText('Voice Style')).not.toBeInTheDocument();
        expect(screen.queryByText('Tech Environment')).not.toBeInTheDocument();
        expect(screen.queryByText('Constraints')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      // Initially on prompt tab
      expect(
        screen.getByText('This is a generated prompt for testing purposes.')
      ).toBeInTheDocument();

      // Switch to quality scores
      const qualityTab = screen.getByRole('tab', { name: /Quality Scores/i });
      await user.click(qualityTab);

      await waitFor(() => {
        expect(screen.getByText('Clarity')).toBeInTheDocument();
      });

      // Switch to specifications
      const specsTab = screen.getByRole('tab', { name: /Specifications/i });
      await user.click(specsTab);

      await waitFor(() => {
        expect(screen.getByText('Goal Type')).toBeInTheDocument();
      });

      // Switch back to prompt
      const promptTab = screen.getByRole('tab', { name: /Generated Prompt/i });
      await user.click(promptTab);

      await waitFor(() => {
        expect(
          screen.getByText('This is a generated prompt for testing purposes.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    it('should have proper tab roles', () => {
      renderWithProviders(<PromptOutput prompt={mockPrompt} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });
  });
});
