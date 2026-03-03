/**
 * @fileoverview Context and provider for the guided user onboarding flow.
 *
 * ## Usage
 * Wrap your app with `<OnboardingProvider>` (inside `QueryClientProvider` and
 * `AuthProvider` since it uses both).  Then call `useOnboarding()` anywhere to
 * access `startOnboarding` for restarting the tour from the help menu.
 *
 * ```tsx
 * // App.tsx
 * <OnboardingProvider>
 *   <YourApp />
 * </OnboardingProvider>
 *
 * // Any component
 * const { startOnboarding } = useOnboarding();
 * ```
 *
 * ## Onboarding trigger logic
 * - Automatically opens for users whose profile has `onboarding_completed = false`.
 * - Persists completion to the `profiles` table when the user finishes the tour.
 * - Emits `onboarding_started` / `onboarding_completed` analytics events.
 * - Does nothing when no authenticated user is present.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingModal } from '@/components/OnboardingModal';

interface OnboardingContextType {
  /** Open (or re-open) the onboarding wizard programmatically. */
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/** Internal controller – lives inside OnboardingProvider. */
function OnboardingController({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch the user's onboarding completion status.
  const { data: profile, isSuccess } = useQuery({
    queryKey: ['profile-onboarding', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as { onboarding_completed: boolean | null };
    },
    enabled: !!user,
  });

  // Auto-open for new users once profile data is available.
  useEffect(() => {
    if (isSuccess && profile && !profile.onboarding_completed) {
      setIsOpen(true);
      // Analytics: onboarding started (fire-and-forget).
      supabase
        .from('analytics_events')
        .insert({ user_id: user?.id, event_type: 'onboarding_started', metadata: {} })
        .then(() => undefined);
    }
  }, [isSuccess, profile, user?.id]);

  // Persist completion status to the backend.
  const { mutate: markComplete } = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-onboarding', user?.id] });
      // Analytics: onboarding finished (fire-and-forget).
      supabase
        .from('analytics_events')
        .insert({ user_id: user?.id, event_type: 'onboarding_completed', metadata: {} })
        .then(() => undefined);
    },
  });

  const startOnboarding = useCallback(() => setIsOpen(true), []);

  const handleComplete = useCallback(() => {
    setIsOpen(false);
    markComplete();
  }, [markComplete]);

  const handleDismiss = useCallback(() => setIsOpen(false), []);

  return (
    <OnboardingContext.Provider value={{ startOnboarding }}>
      {children}
      <OnboardingModal
        open={isOpen}
        onComplete={handleComplete}
        onDismiss={handleDismiss}
      />
    </OnboardingContext.Provider>
  );
}

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * Provides the onboarding flow to the entire application.
 *
 * Must be placed inside `QueryClientProvider` and `AuthProvider` (or equivalent)
 * so that `useQuery`, `useMutation`, and `useAuth` are available.
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  return <OnboardingController>{children}</OnboardingController>;
}

/**
 * Returns onboarding context. Must be used inside `OnboardingProvider`.
 *
 * @throws When called outside of `OnboardingProvider`.
 */
export function useOnboarding(): OnboardingContextType {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
