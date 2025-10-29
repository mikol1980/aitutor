// ============================================================================
// useSession Hook
// ============================================================================
// Fetches and manages session details data

import { useState, useEffect, useCallback } from 'react';
import type { SessionState } from '@/lib/types/session-view.types';
import { fetchSessionDetails } from '@/lib/api/sessions.client';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Custom hook for fetching session details
 * Provides loading, error states and retry mechanism
 */
export function useSession(sessionId: string) {
  const [state, setState] = useState<SessionState>({
    loading: true,
    error: undefined,
    data: undefined,
  });
  const [retryCount, setRetryCount] = useState(0);

  const loadSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const session = await fetchSessionDetails(sessionId);
      setState({
        loading: false,
        error: undefined,
        data: session,
      });
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setState({
        loading: false,
        error: error as any,
        data: undefined,
      });
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const refetch = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      console.error('Max retry attempts reached');
      return;
    }

    setRetryCount((prev) => prev + 1);

    // Simple delay before retry
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await loadSession();
  }, [loadSession, retryCount]);

  return {
    ...state,
    refetch,
    canRetry: retryCount < MAX_RETRY_ATTEMPTS,
  };
}
