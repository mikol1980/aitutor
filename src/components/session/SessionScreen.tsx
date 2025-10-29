// ============================================================================
// Session Screen Component
// ============================================================================
// Main session view container with state management for learning sessions

import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useSessionMessages } from '@/hooks/useSessionMessages';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { SessionHeader } from './SessionHeader';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import type { SessionViewModel, SessionMessageViewModel } from '@/lib/types/session-view.types';

// TEMPORARY: Mock data for testing without authentication
// TODO: Remove this when authentication and database are fully set up
const MOCK_SESSION: SessionViewModel = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  topicId: 'topic-uuid',
  topicTitle: 'Równania kwadratowe',
  startedAtIso: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  endedAtIso: null, // Active session
  aiSummary: null,
};

const MOCK_MESSAGES: SessionMessageViewModel[] = [
  {
    id: 'msg-1',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    sender: 'ai',
    text: 'Cześć! Dziś będziemy ćwiczyć równania kwadratowe. Czy jesteś gotowy?',
    createdAtIso: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: 'msg-2',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    sender: 'user',
    text: 'Tak, jestem gotowy!',
    createdAtIso: new Date(Date.now() - 3400000).toISOString(),
  },
  {
    id: 'msg-3',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    sender: 'ai',
    text: 'Świetnie! Zacznijmy od prostego przykładu. Rozwiąż równanie: x² - 5x + 6 = 0',
    createdAtIso: new Date(Date.now() - 3300000).toISOString(),
  },
  {
    id: 'msg-4',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    sender: 'user',
    text: 'Hmm, jak mam to rozwiązać?',
    createdAtIso: new Date(Date.now() - 3200000).toISOString(),
  },
  {
    id: 'msg-5',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    sender: 'ai',
    text: 'Możesz użyć wzoru na deltę lub spróbować rozłożyć na czynniki. Spróbuj znaleźć dwie liczby, które po przemnożeniu dają 6, a po dodaniu -5.',
    createdAtIso: new Date(Date.now() - 3100000).toISOString(),
  },
];

// TEMPORARY: Set to true to use mock data without authentication
const USE_MOCK_DATA = true;

interface SessionScreenProps {
  sessionId: string;
}

/**
 * Session screen component
 * Main container for session view with data fetching and state management
 */
export function SessionScreen({ sessionId }: SessionScreenProps) {
  // Mock state for testing
  const [mockMessages, setMockMessages] = useState<SessionMessageViewModel[]>(MOCK_MESSAGES);

  // Fetch session details
  const {
    data: session,
    loading: sessionLoading,
    error: sessionError,
    refetch: refetchSession,
    canRetry: canRetrySession,
  } = useSession(sessionId);

  // Fetch and manage messages
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    refetch: refetchMessages,
    loadMore,
    sendMessage,
    canRetry: canRetryMessages,
  } = useSessionMessages(sessionId, {
    limit: 50,
    order: 'asc',
  });

  // TEMPORARY: Use mock data if enabled
  const displaySession = USE_MOCK_DATA ? MOCK_SESSION : session;
  const displayMessages = USE_MOCK_DATA ? mockMessages : messages;
  const displayLoading = USE_MOCK_DATA ? false : sessionLoading || messagesLoading;
  const displayError = USE_MOCK_DATA ? undefined : sessionError || messagesError;
  const displayHasMore = USE_MOCK_DATA ? false : hasMore;

  // Auto-scroll to bottom when new messages arrive
  const scrollRef = useAutoScroll<HTMLDivElement>([displayMessages.length], 'smooth');

  // Loading state - initial load
  if (displayLoading && !displaySession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState label="Ładowanie sesji..." variant="spinner" />
      </div>
    );
  }

  // Error state - session not found or unauthorized
  if (displayError && !displaySession) {
    const errorMessage =
      displayError.code === 'UNAUTHORIZED'
        ? 'Brak autoryzacji. Zaloguj się ponownie.'
        : displayError.code === 'NOT_FOUND'
          ? 'Sesja nie została znaleziona.'
          : displayError.message || 'Nie udało się załadować sesji';

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="container max-w-2xl">
          <ErrorState
            message={errorMessage}
            onRetry={canRetrySession ? refetchSession : undefined}
          />
        </div>
      </div>
    );
  }

  // No session data (should not happen if no error)
  if (!displaySession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="container max-w-2xl">
          <ErrorState message="Brak danych sesji" />
        </div>
      </div>
    );
  }

  // Handle end session callback
  const handleEndSession = async () => {
    // TODO: Implement end session logic
    // For now, just redirect to dashboard
    window.location.href = '/app/dashboard';
  };

  // Handle send message with mock data support
  const handleSendMessage = async (text: string) => {
    if (USE_MOCK_DATA) {
      // Add optimistic message to mock data
      const newMessage: SessionMessageViewModel = {
        id: `msg-${Date.now()}`,
        sessionId,
        sender: 'user',
        text,
        createdAtIso: new Date().toISOString(),
      };
      setMockMessages([...mockMessages, newMessage]);

      // Simulate AI response after 1 second
      setTimeout(() => {
        const aiResponse: SessionMessageViewModel = {
          id: `msg-${Date.now()}`,
          sessionId,
          sender: 'ai',
          text: 'To jest przykładowa odpowiedź AI. W prawdziwej aplikacji tutaj pojawi się odpowiedź od modelu językowego.',
          createdAtIso: new Date().toISOString(),
        };
        setMockMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    } else {
      await sendMessage(text, 'user');
    }
  };

  // Success state - render session
  return (
    <div className="flex h-screen flex-col">
      {/* Header with topic title and end session button */}
      <SessionHeader
        topicTitle={displaySession.topicTitle ?? 'Sesja nauki'}
        isActive={!displaySession.endedAtIso}
        onEndSession={handleEndSession}
      />

      {/* Messages list with auto-scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-background px-4 py-6"
      >
        <div className="container max-w-4xl">
          {displayLoading && displayMessages.length === 0 ? (
            <LoadingState label="Ładowanie wiadomości..." variant="spinner" />
          ) : displayError && displayMessages.length === 0 ? (
            <ErrorState
              message={displayError.message || 'Nie udało się załadować wiadomości'}
              onRetry={canRetryMessages ? refetchMessages : undefined}
            />
          ) : (
            <MessageList
              messages={displayMessages}
              hasMore={displayHasMore}
              onLoadMore={loadMore}
              loading={displayLoading}
            />
          )}
        </div>
      </div>

      {/* Input area - only show if session is active */}
      {!displaySession.endedAtIso && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-4xl px-4 py-4">
            <InputArea onSendMessage={handleSendMessage} disabled={displayLoading} />
          </div>
        </div>
      )}
    </div>
  );
}
