import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingModal } from '../OnboardingModal';

describe('OnboardingModal', () => {
  const mockOnComplete = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (open = true) =>
    renderWithProviders(
      <OnboardingModal
        open={open}
        onComplete={mockOnComplete}
        onDismiss={mockOnDismiss}
      />
    );

  describe('Rendering', () => {
    it('should render the welcome step when opened', () => {
      renderModal();
      expect(screen.getByText(/Welcome to PromptLab/i)).toBeInTheDocument();
    });

    it('should not render content when closed', () => {
      renderModal(false);
      expect(screen.queryByText(/Welcome to PromptLab/i)).not.toBeInTheDocument();
    });

    it('should render a progress indicator', () => {
      renderModal();
      // Progress bar is present with aria-label
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should render step navigation dots', () => {
      renderModal();
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(1);
    });

    it('should not show a Back button on the first step', () => {
      renderModal();
      expect(screen.queryByRole('button', { name: /previous step/i })).not.toBeInTheDocument();
    });

    it('should show a Skip tour button on non-last steps', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /skip onboarding tour/i })).toBeInTheDocument();
    });

    it('should show a Next button on non-last steps', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should advance to the next step when Next is clicked', async () => {
      renderModal();
      const nextButton = screen.getByRole('button', { name: /next step/i });
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/Build Prompts Effortlessly/i)).toBeInTheDocument();
      });
    });

    it('should show the Back button after advancing past the first step', async () => {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous step/i })).toBeInTheDocument();
      });
    });

    it('should go back to the previous step when Back is clicked', async () => {
      renderModal();
      // Go to step 2
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
      await waitFor(() =>
        expect(screen.getByText(/Build Prompts Effortlessly/i)).toBeInTheDocument()
      );
      // Go back to step 1
      fireEvent.click(screen.getByRole('button', { name: /previous step/i }));
      await waitFor(() =>
        expect(screen.getByText(/Welcome to PromptLab/i)).toBeInTheDocument()
      );
    });

    it('should jump to a specific step when a dot is clicked', async () => {
      renderModal();
      const tabs = screen.getAllByRole('tab');
      // Click the third dot (index 2)
      fireEvent.click(tabs[2]);
      await waitFor(() => {
        expect(screen.getByText(/Your Prompt Library/i)).toBeInTheDocument();
      });
    });
  });

  describe('Completion and dismissal', () => {
    it('should call onDismiss when Skip tour is clicked', () => {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: /skip onboarding tour/i }));
      expect(mockOnDismiss).toHaveBeenCalledOnce();
    });

    it('should show "Get Started" button on the last step', async () => {
      renderModal();
      // Navigate to last step using dots
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs[tabs.length - 1]);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /finish onboarding/i })).toBeInTheDocument()
      );
    });

    it('should call onComplete when Get Started is clicked on the last step', async () => {
      renderModal();
      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs[tabs.length - 1]);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /finish onboarding/i })).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /finish onboarding/i }));
      expect(mockOnComplete).toHaveBeenCalledOnce();
    });
  });

  describe('Accessibility', () => {
    it('should render inside a dialog role', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have an accessible aria-label on the dialog', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label');
    });

    it('should have aria-label on the progress bar', () => {
      renderModal();
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label');
    });

    it('should have aria-selected on the active step dot', () => {
      renderModal();
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });
  });
});
