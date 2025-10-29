// ============================================================================
// Message List Component
// ============================================================================
// Scrollable list of session messages with load more functionality

import { MessageItem } from './MessageItem';
import type { SessionMessageViewModel } from '@/lib/types/session-view.types';

interface MessageListProps {
  messages: SessionMessageViewModel[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
}

/**
 * Message list component
 * Displays list of messages with load more button for pagination
 */
export function MessageList({
  messages,
  hasMore,
  onLoadMore,
  loading = false,
}: MessageListProps) {
  // Empty state
  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Brak wiadomości. Rozpocznij konwersację!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Load more button - at the top for older messages */}
      {hasMore && (
        <div className="flex justify-center pb-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? 'Ładowanie...' : 'Załaduj starsze wiadomości'}
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
