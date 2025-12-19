/**
 * useClipboard Hook
 * Copy text to clipboard with status feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseClipboardOptions {
  /** Duration in ms to show "copied" state */
  timeout?: number;
  /** Callback on successful copy */
  onSuccess?: () => void;
  /** Callback on copy failure */
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  /** Whether content was recently copied */
  hasCopied: boolean;
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Reset copied state */
  reset: () => void;
}

/**
 * Hook for copying text to clipboard
 * 
 * @example
 * ```tsx
 * const { hasCopied, copy } = useClipboard({ timeout: 2000 });
 * 
 * <Button onClick={() => copy(someText)}>
 *   {hasCopied ? 'Copied!' : 'Copy'}
 * </Button>
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000, onSuccess, onError } = options;

  const [hasCopied, setHasCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          // Modern async clipboard API
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error('Copy command failed');
          }
        }

        setHasCopied(true);
        onSuccess?.();

        // Reset after timeout
        timeoutRef.current = setTimeout(() => {
          setHasCopied(false);
        }, timeout);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy');
        onError?.(error);
        setHasCopied(false);
        return false;
      }
    },
    [timeout, onSuccess, onError]
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHasCopied(false);
  }, []);

  return { hasCopied, copy, reset };
}

export default useClipboard;
