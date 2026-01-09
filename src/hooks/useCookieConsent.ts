/**
 * @fileoverview Cookie consent management hook.
 * Handles user preferences for different types of cookies/tracking.
 */

import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  necessary: boolean; // Always true - required for site functionality
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

interface CookieConsentState {
  preferences: CookiePreferences;
  hasConsented: boolean;
  consentedAt: string | null;
}

const COOKIE_CONSENT_KEY = 'cookie_consent';

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>({
    preferences: DEFAULT_PREFERENCES,
    hasConsented: false,
    consentedAt: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved consent from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CookieConsentState;
        setState({
          preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences, necessary: true },
          hasConsented: parsed.hasConsented,
          consentedAt: parsed.consentedAt,
        });
      }
    } catch (error) {
      console.error('Failed to load cookie consent:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save consent to localStorage
  const saveConsent = useCallback((preferences: CookiePreferences) => {
    const newState: CookieConsentState = {
      preferences: { ...preferences, necessary: true },
      hasConsented: true,
      consentedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
    }
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    });
  }, [saveConsent]);

  // Reject all optional cookies
  const rejectAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    });
  }, [saveConsent]);

  // Update specific preference
  const updatePreference = useCallback((key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  }, []);

  // Save current preferences
  const savePreferences = useCallback(() => {
    saveConsent(state.preferences);
  }, [state.preferences, saveConsent]);

  // Reset consent (for testing or user request)
  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setState({
        preferences: DEFAULT_PREFERENCES,
        hasConsented: false,
        consentedAt: null,
      });
    } catch (error) {
      console.error('Failed to reset cookie consent:', error);
    }
  }, []);

  return {
    preferences: state.preferences,
    hasConsented: state.hasConsented,
    consentedAt: state.consentedAt,
    isLoaded,
    acceptAll,
    rejectAll,
    updatePreference,
    savePreferences,
    resetConsent,
  };
}
