// ============================================================================
// useSessionMessages Hook
// ============================================================================
// Fetches, manages, and sends session messages with pagination and optimistic updates

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  SessionMessagesState,
  SessionMessageViewModel,
} from '@/lib/types/session-view.types';
import {
  fetchSessionMessages,
  postSessionMessage,
} from '@/lib/api/sessions.client';

const DEFAULT_LIMIT = 50;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

interface UseSessionMessagesOptions {
  limit?: number;
  order?: 'asc' | 'desc';
}

/**
 * Custom hook for fetching and managing session messages
 * Provides loading, error states, pagination, and message sending
 */
export function useSessionMessages(
  sessionId: string,
  options?: UseSessionMessagesOptions
) {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const order = options?.order ?? 'asc';

  const [state, setState] = useState<SessionMessagesState>({
    messages: [],
    loading: true,
    error: undefined,
    total: 0,
    hasMore: false,
  });
  const [retryCount, setRetryCount] = useState(0);

  // Track if we're currently sending a message to prevent duplicates
  const isSendingRef = useRef(false);

  const loadMessages = useCallback(
    async (offset = 0, append = false) => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      try {
        const response = await fetchSessionMessages(sessionId, {
          limit,
          offset,
          order,
        });

        setState((prev) => ({
          messages: append ? [...prev.messages, ...response.messages] : response.messages,
          loading: false,
          error: undefined,
          total: response.total,
          hasMore: offset + response.messages.length < response.total,
        }));
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as any,
        }));
      }
    },
    [sessionId, limit, order]
  );

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const refetch = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      console.error('Max retry attempts reached');
      return;
    }

    setRetryCount((prev) => prev + 1);

    // Simple delay before retry
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await loadMessages();
  }, [loadMessages, retryCount]);

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    await loadMessages(state.messages.length, true);
  }, [loadMessages, state.loading, state.hasMore, state.messages.length]);

  /**
   * Send a new message with optimistic update
   */
  const sendMessage = useCallback(
    async (text: string, sender: 'user' | 'ai' = 'user') => {
      if (isSendingRef.current) {
        console.warn('Already sending a message, skipping...');
        return;
      }

      isSendingRef.current = true;

      // Generate temporary ID for optimistic message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: SessionMessageViewModel = {
        id: tempId,
        sessionId,
        sender,
        text,
        createdAtIso: new Date().toISOString(),
        isOptimistic: true,
        clientId: tempId,
      };

      // Optimistically add message to state
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage],
        total: prev.total + 1,
      }));

      try {
        // Send message to API
        const newMessage = await postSessionMessage(sessionId, text, sender);

        // Replace optimistic message with real one
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.clientId === tempId ? newMessage : msg
          ),
        }));
      } catch (error) {
        console.error('Failed to send message:', error);

        // Remove optimistic message on error
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => msg.clientId !== tempId),
          total: prev.total - 1,
          error: error as any,
        }));
      } finally {
        isSendingRef.current = false;
      }
    },
    [sessionId]
  );

  return {
    ...state,
    refetch,
    loadMore,
    sendMessage,
    canRetry: retryCount < MAX_RETRY_ATTEMPTS,
  };
}
