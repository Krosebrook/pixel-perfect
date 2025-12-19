/**
 * usePagination Hook
 * Handles pagination state and navigation logic
 */

import { useState, useCallback, useMemo } from 'react';
import { API } from '@/lib/constants';

export interface UsePaginationOptions {
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Items per page */
  pageSize?: number;
  /** Total number of items */
  totalItems?: number;
}

export interface UsePaginationReturn {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Start index for current page (0-indexed) */
  startIndex: number;
  /** End index for current page (0-indexed, exclusive) */
  endIndex: number;
  /** Whether there's a previous page */
  hasPreviousPage: boolean;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  previousPage: () => void;
  /** Go to the first page */
  firstPage: () => void;
  /** Go to the last page */
  lastPage: () => void;
  /** Update page size */
  setPageSize: (size: number) => void;
  /** Update total items */
  setTotalItems: (total: number) => void;
  /** Reset to first page */
  reset: () => void;
  /** Get pagination info for API calls */
  paginationParams: { page: number; pageSize: number; offset: number };
}

/**
 * Hook for managing pagination state
 * 
 * @example
 * ```tsx
 * const { 
 *   currentPage, 
 *   pageSize, 
 *   totalPages,
 *   goToPage,
 *   nextPage,
 *   previousPage,
 *   paginationParams 
 * } = usePagination({ 
 *   initialPage: 1, 
 *   pageSize: 20, 
 *   totalItems: 100 
 * });
 * 
 * // Use paginationParams in API calls
 * const { data } = useQuery({
 *   queryKey: ['items', paginationParams],
 *   queryFn: () => fetchItems(paginationParams)
 * });
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    pageSize: initialPageSize = API.DEFAULT_PAGE_SIZE,
    totalItems: initialTotalItems = 0,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalItems, setTotalItemsState] = useState(initialTotalItems);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    const validSize = Math.max(1, Math.min(size, API.MAX_PAGE_SIZE));
    setPageSizeState(validSize);
    // Reset to first page when page size changes
    setCurrentPage(1);
  }, []);

  const setTotalItems = useCallback((total: number) => {
    setTotalItemsState(Math.max(0, total));
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  const paginationParams = useMemo(
    () => ({
      page: currentPage,
      pageSize,
      offset: startIndex,
    }),
    [currentPage, pageSize, startIndex]
  );

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotalItems,
    reset,
    paginationParams,
  };
}

export default usePagination;
