/**
 * useLocalProfile Hook
 * Manages user profile data in localStorage (no auth required)
 */

import { useState, useCallback, useEffect } from 'react';

export interface LocalProfile {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  environmentMode: 'sandbox' | 'production';
  createdAt: string;
}

const PROFILE_KEY = 'user_profile';

function getDefaultProfile(): LocalProfile {
  return {
    displayName: '',
    bio: '',
    avatarUrl: null,
    environmentMode: 'production',
    createdAt: new Date().toISOString(),
  };
}

function loadProfile(): LocalProfile {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      return { ...getDefaultProfile(), ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return getDefaultProfile();
}

export function useLocalProfile() {
  const [profile, setProfileState] = useState<LocalProfile>(loadProfile);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PROFILE_KEY) {
        setProfileState(loadProfile());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const updateProfile = useCallback((updates: Partial<LocalProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { profile, updateProfile };
}
