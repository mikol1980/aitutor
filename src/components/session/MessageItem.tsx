// ============================================================================
// Message Item Component
// ============================================================================
// Individual message bubble in session chat

import { cn } from '@/lib/utils';
import type { SessionMessageViewModel } from '@/lib/types/session-view.types';

interface MessageItemProps {
  message: SessionMessageViewModel;
}

/**
 * Message item component
 * Displays a single message with sender-specific styling
 */
export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.sender === 'user';
  const isOptimistic = message.isOptimistic ?? false;

  return (
    <div
      className={cn(
        'mb-4 flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
          isOptimistic && 'opacity-60'
        )}
      >
        {/* Message text */}
        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        {/* Timestamp */}
        <span
          className={cn(
            'mt-1 block text-xs',
            isUser
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground'
          )}
        >
          {new Date(message.createdAtIso).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>

        {/* Optimistic indicator */}
        {isOptimistic && (
          <span className="mt-1 block text-xs italic">Wysyłanie...</span>
        )}
      </div>
    </div>
  );
}
