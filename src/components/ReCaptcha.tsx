/**
 * @fileoverview reCAPTCHA v2 checkbox component.
 * Only loads the reCAPTCHA script and renders the widget when a valid site key
 * is configured via the VITE_RECAPTCHA_SITE_KEY environment variable.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// reCAPTCHA site key from environment (publishable key - safe for frontend)
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'compact' | 'normal';
      }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

/**
 * Returns true only when VITE_RECAPTCHA_SITE_KEY is a non-empty,
 * non-placeholder string that looks like a real key.
 */
function isKeyConfigured(): boolean {
  if (!RECAPTCHA_SITE_KEY) return false;
  const trimmed = RECAPTCHA_SITE_KEY.trim();
  if (trimmed.length === 0) return false;
  // Reject obvious placeholder values
  if (/^(your[_-]?|example|test|placeholder|TODO)/i.test(trimmed)) return false;
  return true;
}

export function ReCaptcha({ onVerify, onExpire, onError }: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const isRenderedRef = useRef(false);
  const [renderError, setRenderError] = useState(false);

  const handleError = useCallback(() => {
    setRenderError(true);
    onError?.();
  }, [onError]);

  const renderCaptcha = useCallback(() => {
    if (!containerRef.current || !window.grecaptcha || isRenderedRef.current) return;

    try {
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': handleError,
        theme: 'light',
        size: 'normal',
      });
      isRenderedRef.current = true;
    } catch (error) {
      console.error('reCAPTCHA render error:', error);
      setRenderError(true);
    }
  }, [onVerify, onExpire, handleError]);

  useEffect(() => {
    if (!isKeyConfigured()) return;

    // Check if script already exists
    if (document.querySelector('script[src*="recaptcha"]')) {
      if (window.grecaptcha) {
        window.grecaptcha.ready(renderCaptcha);
      }
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;

    window.onRecaptchaLoad = () => {
      window.grecaptcha.ready(renderCaptcha);
    };

    document.head.appendChild(script);

    return () => {
      window.onRecaptchaLoad = undefined;
    };
  }, [renderCaptcha]);

  // Don't render anything if the key isn't configured or if there was a render error
  if (!isKeyConfigured() || renderError) {
    return null;
  }

  return <div ref={containerRef} className="flex justify-center my-4" />;
}

export function resetReCaptcha() {
  if (window.grecaptcha) {
    try {
      window.grecaptcha.reset();
    } catch {
      // Silently ignore if widget wasn't rendered
    }
  }
}
