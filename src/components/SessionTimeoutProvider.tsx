import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutWarning } from '@/components/SessionTimeoutWarning';
import { useAuth } from '@/contexts/AuthContext';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const { user } = useAuth();
  const { showWarning, remainingSeconds, staySignedIn, logOutNow } = useSessionTimeout();

  // Only show timeout warning for authenticated users
  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <SessionTimeoutWarning
        open={showWarning}
        remainingSeconds={remainingSeconds}
        onStaySignedIn={staySignedIn}
        onLogOut={logOutNow}
      />
    </>
  );
}
