/**
 * @fileoverview reCAPTCHA v2 checkbox component.
 */

import { useEffect, useRef, useCallback } from 'react';

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

export function ReCaptcha({ onVerify, onExpire, onError }: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const isRenderedRef = useRef(false);

  const renderCaptcha = useCallback(() => {
    if (!containerRef.current || !window.grecaptcha || isRenderedRef.current) return;
    
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key not configured');
      return;
    }

    try {
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
        theme: 'light',
        size: 'normal',
      });
      isRenderedRef.current = true;
    } catch (error) {
      console.error('reCAPTCHA render error:', error);
    }
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
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

  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  return <div ref={containerRef} className="flex justify-center my-4" />;
}

export function resetReCaptcha() {
  if (window.grecaptcha) {
    window.grecaptcha.reset();
  }
}
