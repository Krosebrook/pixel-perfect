import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SESSION_TIMEOUT_MS, SESSION_WARNING_BEFORE_TIMEOUT_MS } from '@/lib/constants';

interface UseSessionTimeoutOptions {
  timeoutMs?: number;
  warningBeforeMs?: number;
  onTimeout?: () => void;
}

interface SessionTimeoutState {
  showWarning: boolean;
  remainingSeconds: number;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const { 
    timeoutMs = SESSION_TIMEOUT_MS, 
    warningBeforeMs = SESSION_WARNING_BEFORE_TIMEOUT_MS,
    onTimeout 
  } = options;
  
  const { user, signOut } = useAuth();
  const [state, setState] = useState<SessionTimeoutState>({
    showWarning: false,
    remainingSeconds: Math.floor(warningBeforeMs / 1000),
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleTimeout = useCallback(async () => {
    clearAllTimers();
    setState({ showWarning: false, remainingSeconds: 0 });
    onTimeout?.();
    await signOut();
  }, [clearAllTimers, onTimeout, signOut]);

  const startCountdown = useCallback(() => {
    let remaining = Math.floor(warningBeforeMs / 1000);
    setState({ showWarning: true, remainingSeconds: remaining });

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setState(prev => ({ ...prev, remainingSeconds: remaining }));
      
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);
  }, [warningBeforeMs]);

  const resetTimer = useCallback(() => {
    if (!user) return;
    
    clearAllTimers();
    lastActivityRef.current = Date.now();
    setState({ showWarning: false, remainingSeconds: Math.floor(warningBeforeMs / 1000) });

    // Set warning timeout (triggers before actual timeout)
    const warningDelay = timeoutMs - warningBeforeMs;
    warningTimeoutRef.current = setTimeout(() => {
      startCountdown();
    }, warningDelay);

    // Set actual timeout
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeoutMs);
  }, [user, clearAllTimers, timeoutMs, warningBeforeMs, startCountdown, handleTimeout]);

  const staySignedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const logOutNow = useCallback(async () => {
    clearAllTimers();
    setState({ showWarning: false, remainingSeconds: 0 });
    await signOut();
  }, [clearAllTimers, signOut]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) {
      clearAllTimers();
      return;
    }

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    
    const handleActivity = () => {
      // Only reset if not already in warning state
      if (!state.showWarning) {
        resetTimer();
      }
    };

    // Throttle activity detection
    let lastEventTime = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastEventTime > 1000) { // Throttle to once per second
        lastEventTime = now;
        handleActivity();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, throttledHandler);
      });
      clearAllTimers();
    };
  }, [user, resetTimer, clearAllTimers, state.showWarning]);

  return {
    showWarning: state.showWarning,
    remainingSeconds: state.remainingSeconds,
    staySignedIn,
    logOutNow,
    resetTimer,
  };
}
