// ============================================================================
// useProfile Hook
// ============================================================================
// Fetches and manages user profile data

import { useState, useEffect, useCallback } from 'react';
import type { ProfileState } from '@/lib/types/profile-view.types';
import { fetchProfile } from '@/lib/api/profile.client';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Custom hook for fetching user profile
 * Provides loading, error states and retry mechanism
 */
export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    loading: true,
    error: undefined,
    data: undefined,
  });
  const [retryCount, setRetryCount] = useState(0);

  const loadProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const profile = await fetchProfile();
      setState({
        loading: false,
        error: undefined,
        data: profile,
      });
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setState({
        loading: false,
        error: error as any,
        data: undefined,
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refetch = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      console.error('Max retry attempts reached');
      return;
    }

    setRetryCount((prev) => prev + 1);
    
    // Simple delay before retry
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await loadProfile();
  }, [loadProfile, retryCount]);

  return {
    ...state,
    refetch,
    canRetry: retryCount < MAX_RETRY_ATTEMPTS,
  };
}

