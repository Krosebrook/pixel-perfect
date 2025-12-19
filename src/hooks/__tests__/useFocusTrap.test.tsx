/**
 * Tests for useFocusTrap and useArrowNavigation hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap, useArrowNavigation } from '../useFocusTrap';

describe('useFocusTrap', () => {
  beforeEach(() => {
    // Create a container with focusable elements for testing
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('initial state', () => {
    it('should return containerRef and handleKeyDown', () => {
      const { result } = renderHook(() => useFocusTrap());

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.handleKeyDown).toBeDefined();
      expect(typeof result.current.handleKeyDown).toBe('function');
    });
  });

  describe('handleKeyDown', () => {
    it('should call onEscape when Escape key is pressed', () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true, onEscape })
      );

      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onEscape).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call onEscape when not active', () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: false, onEscape })
      );

      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('should default isActive to true', () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() => useFocusTrap({ onEscape }));

      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onEscape).toHaveBeenCalled();
    });

    it('should accept custom options', () => {
      const { result } = renderHook(() =>
        useFocusTrap({
          isActive: true,
          autoFocus: false,
          restoreFocus: false,
          onEscape: vi.fn(),
        })
      );

      expect(result.current.containerRef).toBeDefined();
    });
  });
});

describe('useArrowNavigation', () => {
  describe('vertical navigation', () => {
    it('should navigate down with ArrowDown', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 0, onSelect, orientation: 'vertical' })
      );

      const event = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should navigate up with ArrowUp', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 2, onSelect, orientation: 'vertical' })
      );

      const event = {
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('should loop from last to first', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 4, onSelect, loop: true })
      );

      const event = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(0);
    });

    it('should loop from first to last', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 0, onSelect, loop: true })
      );

      const event = {
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(4);
    });

    it('should not loop when loop is false', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 4, onSelect, loop: false })
      );

      const event = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      // Should not call onSelect because we're already at the last item
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('horizontal navigation', () => {
    it('should navigate right with ArrowRight', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 0, onSelect, orientation: 'horizontal' })
      );

      const event = {
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('should navigate left with ArrowLeft', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 2, onSelect, orientation: 'horizontal' })
      );

      const event = {
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(1);
    });
  });

  describe('both orientation', () => {
    it('should respond to all arrow keys', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 2, onSelect, orientation: 'both' })
      );

      // ArrowUp
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });
      expect(onSelect).toHaveBeenLastCalledWith(1);

      // ArrowDown
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });
      expect(onSelect).toHaveBeenLastCalledWith(3);

      // ArrowLeft
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });
      expect(onSelect).toHaveBeenLastCalledWith(1);

      // ArrowRight
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });
      expect(onSelect).toHaveBeenLastCalledWith(3);
    });
  });

  describe('Home and End keys', () => {
    it('should navigate to first item with Home', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 3, onSelect })
      );

      const event = {
        key: 'Home',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(0);
    });

    it('should navigate to last item with End', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 1, onSelect })
      );

      const event = {
        key: 'End',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).toHaveBeenCalledWith(4);
    });
  });

  describe('edge cases', () => {
    it('should handle empty list', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(0, { currentIndex: 0, onSelect })
      );

      const event = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should ignore unhandled keys', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useArrowNavigation(5, { currentIndex: 0, onSelect })
      );

      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(onSelect).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
