/**
 * Tests for usePagination hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('initial state', () => {
    it('should have default initial values', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(20); // API.DEFAULT_PAGE_SIZE
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(0);
      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should accept custom initial values', () => {
      const { result } = renderHook(() =>
        usePagination({
          initialPage: 2,
          pageSize: 10,
          totalItems: 100,
        })
      );

      expect(result.current.currentPage).toBe(2);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalItems).toBe(100);
      expect(result.current.totalPages).toBe(10);
    });
  });

  describe('computed values', () => {
    it('should calculate totalPages correctly', () => {
      const { result, rerender } = renderHook(
        ({ totalItems, pageSize }) => usePagination({ totalItems, pageSize }),
        { initialProps: { totalItems: 95, pageSize: 10 } }
      );

      expect(result.current.totalPages).toBe(10);

      rerender({ totalItems: 100, pageSize: 10 });
      expect(result.current.totalPages).toBe(10);

      rerender({ totalItems: 101, pageSize: 10 });
      expect(result.current.totalPages).toBe(11);
    });

    it('should calculate startIndex and endIndex correctly', () => {
      const { result } = renderHook(() =>
        usePagination({
          initialPage: 2,
          pageSize: 10,
          totalItems: 35,
        })
      );

      expect(result.current.startIndex).toBe(10);
      expect(result.current.endIndex).toBe(20);

      // Go to last page
      act(() => {
        result.current.goToPage(4);
      });

      expect(result.current.startIndex).toBe(30);
      expect(result.current.endIndex).toBe(35); // Should not exceed totalItems
    });

    it('should calculate hasPreviousPage and hasNextPage correctly', () => {
      const { result } = renderHook(() =>
        usePagination({
          initialPage: 1,
          pageSize: 10,
          totalItems: 30,
        })
      );

      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('navigation', () => {
    it('should go to a specific page', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, pageSize: 10 })
      );

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('should clamp page to valid range', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 50, pageSize: 10 })
      );

      act(() => {
        result.current.goToPage(0);
      });
      expect(result.current.currentPage).toBe(1);

      act(() => {
        result.current.goToPage(-5);
      });
      expect(result.current.currentPage).toBe(1);

      act(() => {
        result.current.goToPage(100);
      });
      expect(result.current.currentPage).toBe(5);
    });

    it('should navigate to next page', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 30, pageSize: 10 })
      );

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(3);

      // Should not go beyond last page
      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(3);
    });

    it('should navigate to previous page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, totalItems: 30, pageSize: 10 })
      );

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);

      // Should not go before first page
      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should navigate to first page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, totalItems: 100, pageSize: 10 })
      );

      act(() => {
        result.current.firstPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should navigate to last page', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, totalItems: 100, pageSize: 10 })
      );

      act(() => {
        result.current.lastPage();
      });

      expect(result.current.currentPage).toBe(10);
    });
  });

  describe('page size', () => {
    it('should update page size', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, pageSize: 10 })
      );

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalPages).toBe(4);
    });

    it('should reset to first page when page size changes', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 5, totalItems: 100, pageSize: 10 })
      );

      act(() => {
        result.current.setPageSize(20);
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should clamp page size to valid range', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setPageSize(0);
      });
      expect(result.current.pageSize).toBe(1);

      act(() => {
        result.current.setPageSize(-10);
      });
      expect(result.current.pageSize).toBe(1);

      act(() => {
        result.current.setPageSize(1000);
      });
      expect(result.current.pageSize).toBe(100); // API.MAX_PAGE_SIZE
    });
  });

  describe('total items', () => {
    it('should update total items', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 50, pageSize: 10 })
      );

      act(() => {
        result.current.setTotalItems(100);
      });

      expect(result.current.totalItems).toBe(100);
      expect(result.current.totalPages).toBe(10);
    });

    it('should not allow negative total items', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setTotalItems(-50);
      });

      expect(result.current.totalItems).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial values', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, pageSize: 10, totalItems: 100 })
      );

      // Make some changes
      act(() => {
        result.current.goToPage(5);
        result.current.setPageSize(25);
      });

      expect(result.current.currentPage).toBe(1); // Reset due to page size change
      expect(result.current.pageSize).toBe(25);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
    });
  });

  describe('paginationParams', () => {
    it('should return correct pagination params for API calls', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, pageSize: 20, totalItems: 100 })
      );

      expect(result.current.paginationParams).toEqual({
        page: 3,
        pageSize: 20,
        offset: 40,
      });
    });

    it('should update paginationParams when state changes', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, pageSize: 10, totalItems: 100 })
      );

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.paginationParams).toEqual({
        page: 5,
        pageSize: 10,
        offset: 40,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero total items', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 0, pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(0);
    });

    it('should handle totalItems less than pageSize', () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 5, pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(5);
      expect(result.current.hasNextPage).toBe(false);
    });
  });
});
