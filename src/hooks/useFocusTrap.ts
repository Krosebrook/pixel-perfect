/**
 * useFocusTrap Hook
 * Manages focus trapping for modal dialogs and overlays
 */

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive?: boolean;
  /** Whether to auto-focus the first element when activated */
  autoFocus?: boolean;
  /** Whether to restore focus when deactivated */
  restoreFocus?: boolean;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
}

interface UseFocusTrapReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Handle keydown events for the container */
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Hook for trapping focus within a container
 * 
 * @example
 * ```tsx
 * const { containerRef, handleKeyDown } = useFocusTrap({
 *   isActive: isOpen,
 *   onEscape: () => setIsOpen(false),
 * });
 * 
 * return (
 *   <div ref={containerRef} onKeyDown={handleKeyDown}>
 *     <button>First</button>
 *     <button>Last</button>
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const {
    isActive = true,
    autoFocus = true,
    restoreFocus = true,
    onEscape,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => el.offsetParent !== null); // Filter out hidden elements
  }, []);

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    // Handle Escape key
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape?.();
      return;
    }

    // Handle Tab key for focus trapping
    if (event.key === 'Tab') {
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        // Shift + Tab: move focus backward
        if (activeElement === firstElement || !containerRef.current?.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move focus forward
        if (activeElement === lastElement || !containerRef.current?.contains(activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isActive, getFocusableElements, onEscape]);

  // Store previous active element and focus first element when activated
  useEffect(() => {
    if (isActive) {
      previousActiveElement.current = document.activeElement;
      
      if (autoFocus) {
        // Delay to ensure the container is rendered
        requestAnimationFrame(() => {
          focusFirst();
        });
      }
    }

    return () => {
      if (isActive && restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, autoFocus, restoreFocus, focusFirst]);

  return {
    containerRef,
    handleKeyDown,
  };
}

/**
 * Hook for handling keyboard navigation in lists
 */
export function useArrowNavigation(
  itemCount: number,
  options: {
    currentIndex?: number;
    onSelect?: (index: number) => void;
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {}
) {
  const {
    currentIndex = 0,
    onSelect,
    orientation = 'vertical',
    loop = true,
  } = options;

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (itemCount === 0) return;

    let newIndex = currentIndex;
    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';

    switch (event.key) {
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault();
          newIndex = currentIndex - 1;
        }
        break;
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault();
          newIndex = currentIndex + 1;
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = currentIndex + 1;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = itemCount - 1;
        break;
      default:
        return;
    }

    // Handle looping
    if (loop) {
      if (newIndex < 0) newIndex = itemCount - 1;
      if (newIndex >= itemCount) newIndex = 0;
    } else {
      newIndex = Math.max(0, Math.min(newIndex, itemCount - 1));
    }

    if (newIndex !== currentIndex) {
      onSelect?.(newIndex);
    }
  }, [itemCount, currentIndex, onSelect, orientation, loop]);

  return { handleKeyDown };
}

export default useFocusTrap;
