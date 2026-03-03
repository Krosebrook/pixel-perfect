/**
 * @fileoverview Guided user onboarding wizard modal.
 *
 * Displays a multi-step tour covering PromptLab's key features:
 *   1. Welcome
 *   2. Prompt Builder
 *   3. Prompt Library
 *   4. Model Comparison
 *   5. Analytics
 *   6. Team Features
 *   7. API Access
 *   8. API Docs
 *   9. Next Steps (success screen)
 *
 * ## Adding a new step
 * 1. Add a new entry to the `STEPS` array below with a unique `id`, `title`,
 *    `description`, and an `icon` from lucide-react.
 * 2. Optionally set `linkTo` and `linkLabel` to provide a CTA link.
 * The modal automatically handles navigation, progress indicators, and
 * keyboard accessibility (inherited from Radix Dialog).
 *
 * ## Accessibility
 * - Built on @radix-ui/react-dialog – fully keyboard navigable.
 * - Focus is trapped inside the modal while open.
 * - Progress dots include aria-label for screen readers.
 * - All buttons have descriptive labels.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Library,
  BarChart,
  Users,
  Key,
  FileText,
  Layers,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';

/** Describes a single onboarding step. */
interface OnboardingStep {
  /** Unique identifier for the step. */
  id: string;
  /** Short heading displayed in the modal. */
  title: string;
  /** Descriptive paragraph shown to the user. */
  description: string;
  /** Lucide icon component rendered above the title. */
  icon: React.ElementType;
  /** Optional internal link shown as a CTA button. */
  linkTo?: string;
  /** Label for the optional CTA button. */
  linkLabel?: string;
}

/**
 * Ordered list of onboarding steps.
 * To add a new step, append an entry here – no other changes required.
 */
const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PromptLab! 🎉',
    description:
      'PromptLab helps you craft, test, and compare AI prompts at scale. ' +
      'This short tour covers the key features so you can hit the ground running.',
    icon: Zap,
  },
  {
    id: 'prompt-builder',
    title: 'Build Prompts Effortlessly',
    description:
      'Use the Prompt Builder on the home page to generate high-quality prompts ' +
      'with just a few inputs. Tweak parameters, preview results, and iterate fast.',
    icon: Zap,
    linkTo: '/',
    linkLabel: 'Open Prompt Builder',
  },
  {
    id: 'prompt-library',
    title: 'Your Prompt Library',
    description:
      'Save, organise, and reuse your best prompts in the Library. ' +
      'Tag them by category, mark favourites, and share with your team.',
    icon: Library,
    linkTo: '/prompts',
    linkLabel: 'Go to Library',
  },
  {
    id: 'model-comparison',
    title: 'Compare AI Models',
    description:
      'Run the same prompt across multiple models side-by-side. ' +
      'Compare quality, cost, and latency to pick the best model for each use case.',
    icon: Layers,
    linkTo: '/models/compare',
    linkLabel: 'Open Model Comparison',
  },
  {
    id: 'analytics',
    title: 'Track Performance',
    description:
      'The Analytics dashboard gives you insight into prompt quality, ' +
      'cost trends, model usage, and test-run history over time.',
    icon: BarChart,
    linkTo: '/analytics',
    linkLabel: 'View Analytics',
  },
  {
    id: 'teams',
    title: 'Collaborate with Your Team',
    description:
      'Invite colleagues, share prompt libraries, and run batch tests together ' +
      'in the Teams section. Role-based access keeps everything secure.',
    icon: Users,
    linkTo: '/teams',
    linkLabel: 'Manage Teams',
  },
  {
    id: 'api-access',
    title: 'API Access',
    description:
      'Integrate PromptLab into your own pipelines with our REST API. ' +
      'Generate an API key, then follow the interactive API Docs to get started.',
    icon: Key,
    linkTo: '/api-keys',
    linkLabel: 'Get API Keys',
  },
  {
    id: 'api-docs',
    title: 'Interactive API Docs',
    description:
      'Explore and test every API endpoint directly in the browser. ' +
      'The docs include code examples for popular languages.',
    icon: FileText,
    linkTo: '/api-docs',
    linkLabel: 'Read API Docs',
  },
  {
    id: 'success',
    title: "You're all set! 🚀",
    description:
      "You've completed the PromptLab tour. Head to the Prompt Builder to create " +
      'your first prompt, or explore any of the features from the navigation bar. ' +
      'You can restart this tour any time from the Help menu.',
    icon: CheckCircle,
    linkTo: '/',
    linkLabel: 'Start Building',
  },
];

interface OnboardingModalProps {
  open: boolean;
  /** Called when the user finishes the last step (marks onboarding complete). */
  onComplete: () => void;
  /** Called when the user dismisses the modal mid-tour (does NOT mark complete). */
  onDismiss: () => void;
}

/**
 * Multi-step onboarding wizard built on the Radix Dialog primitive.
 *
 * @param open     - Whether the dialog is visible.
 * @param onComplete - Callback fired when the user reaches and confirms the last step.
 * @param onDismiss  - Callback fired when the user skips or closes mid-tour.
 */
export function OnboardingModal({ open, onComplete, onDismiss }: OnboardingModalProps) {
  const [stepIndex, setStepIndex] = React.useState(0);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;
  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  // Reset to first step whenever the modal is opened.
  React.useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        className="max-w-lg"
        aria-label={`Onboarding step ${stepIndex + 1} of ${STEPS.length}: ${step.title}`}
      >
        {/* Progress bar */}
        <Progress
          value={progressPercent}
          className="h-1 mb-2"
          aria-label={`Onboarding progress: step ${stepIndex + 1} of ${STEPS.length}`}
        />

        <DialogHeader className="text-center sm:text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Optional CTA link */}
        {step.linkTo && step.linkLabel && (
          <div className="flex justify-center py-2">
            <a
              href={step.linkTo}
              className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${step.linkLabel} – opens in same tab`}
            >
              {step.linkLabel}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        )}

        {/* Step dots */}
        <div
          className="flex justify-center gap-1.5 py-2"
          role="tablist"
          aria-label="Onboarding steps"
        >
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === stepIndex}
              aria-label={`Step ${i + 1}: ${s.title}`}
              onClick={() => setStepIndex(i)}
              className={`h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                i === stepIndex ? 'w-6 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={handleBack} aria-label="Previous step">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Skip button – available on every step except the last */}
            {!isLast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                aria-label="Skip onboarding tour"
              >
                <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Skip tour
              </Button>
            )}

            <Button onClick={handleNext} aria-label={isLast ? 'Finish onboarding' : 'Next step'}>
              {isLast ? (
                <>
                  <CheckCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

