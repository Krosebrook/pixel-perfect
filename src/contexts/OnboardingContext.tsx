import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { OnboardingModal } from '@/components/OnboardingModal';

interface OnboardingContextType {
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = 'onboarding_completed';

function OnboardingController({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const startOnboarding = useCallback(() => setIsOpen(true), []);

  const handleComplete = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

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

export function OnboardingProvider({ children }: { children: ReactNode }) {
  return <OnboardingController>{children}</OnboardingController>;
}

export function useOnboarding(): OnboardingContextType {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
