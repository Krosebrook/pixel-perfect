import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SESSION_TIMEOUT_MS, 
  SESSION_WARNING_BEFORE_TIMEOUT_MS, 
  TRUSTED_DEVICE_TIMEOUT_MS,
  STORAGE_KEYS 
} from '@/lib/constants';

interface UseSessionTimeoutOptions {
  warningBeforeMs?: number;
  onTimeout?: () => void;
}

interface SessionTimeoutState {
  showWarning: boolean;
  remainingSeconds: number;
}

function getStoredTimeout(): number {
  // Check if device is trusted (extended timeout)
  const rememberDevice = localStorage.getItem(STORAGE_KEYS.REMEMBER_DEVICE);
  if (rememberDevice === 'true') {
    return TRUSTED_DEVICE_TIMEOUT_MS;
  }
  
  // Check user preference
  const stored = localStorage.getItem(STORAGE_KEYS.SESSION_TIMEOUT);
  if (stored) {
    return parseInt(stored, 10);
  }
  
  return SESSION_TIMEOUT_MS;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const { 
    warningBeforeMs = SESSION_WARNING_BEFORE_TIMEOUT_MS,
    onTimeout 
  } = options;
  
  const [timeoutMs, setTimeoutMs] = useState<number>(getStoredTimeout);
  
  const { user, signOut } = useAuth();
  const [state, setState] = useState<SessionTimeoutState>({
    showWarning: false,
    remainingSeconds: Math.floor(warningBeforeMs / 1000),
  });
  
  // Listen for timeout setting changes
  useEffect(() => {
    const handleTimeoutChange = (e: CustomEvent<number>) => {
      setTimeoutMs(e.detail);
    };
    
    window.addEventListener('session-timeout-changed', handleTimeoutChange as EventListener);
    return () => {
      window.removeEventListener('session-timeout-changed', handleTimeoutChange as EventListener);
    };
  }, []);
  
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
