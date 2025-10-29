// ============================================================================
// useUserProgress Hook
// ============================================================================
// Fetches and manages user progress data with optional filtering

import { useState, useEffect, useCallback } from 'react';
import type { ProgressState, ProgressFilters } from '@/lib/types/progress-view.types';
import { fetchUserProgress } from '@/lib/api/progress.client';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Custom hook for fetching user progress overview
 * Provides loading, error states, retry mechanism, and filter management
 *
 * @param initialFilters - Optional initial filters for section/status
 * @returns ProgressState with data, loading, error, and control functions
 *
 * @example
 * // Basic usage - fetch all progress
 * const { data, loading, error, refetch } = useUserProgress();
 *
 * @example
 * // With initial filter
 * const { data, loading, setFilters } = useUserProgress({
 *   sectionId: 'uuid-here'
 * });
 *
 * @example
 * // Change filters dynamically
 * const { data, setFilters } = useUserProgress();
 * // Later:
 * setFilters({ status: 'completed' });
 */
export function useUserProgress(initialFilters: ProgressFilters = {}) {
  const [state, setState] = useState<ProgressState>({
    loading: true,
    error: undefined,
    data: undefined,
    filters: initialFilters,
  });
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Load progress data with current filters
   */
  const loadProgress = useCallback(async (filters: ProgressFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const progressData = await fetchUserProgress(filters);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: undefined,
        data: progressData,
      }));
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as any,
        data: undefined,
      }));
    }
  }, []);

  /**
   * Initial load and reload when filters change
   */
  useEffect(() => {
    loadProgress(state.filters);
  }, [state.filters, loadProgress]);

  /**
   * Manually refetch with current filters
   * Includes retry logic with exponential backoff
   */
  const refetch = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      console.error('Max retry attempts reached for user progress');
      return;
    }

    setRetryCount((prev) => prev + 1);

    // Simple delay before retry (could be exponential: RETRY_DELAY_MS * 2^retryCount)
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await loadProgress(state.filters);
  }, [loadProgress, state.filters, retryCount]);

  /**
   * Update filters and trigger refetch
   * Resets retry count
   */
  const setFilters = useCallback((newFilters: ProgressFilters) => {
    setRetryCount(0); // Reset retry count when changing filters
    setState((prev) => ({
      ...prev,
      filters: newFilters,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  return {
    // State
    loading: state.loading,
    error: state.error,
    data: state.data,
    filters: state.filters,

    // Actions
    refetch,
    setFilters,
    clearFilters,

    // Retry control
    canRetry: retryCount < MAX_RETRY_ATTEMPTS,
    retryCount,
  };
}
