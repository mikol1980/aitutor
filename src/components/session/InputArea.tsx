// ============================================================================
// Input Area Component
// ============================================================================
// Text input area for sending messages in session view

import { useState, type KeyboardEvent } from 'react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Input area component
 * Textarea with send button for composing and sending messages
 */
export function InputArea({
  onSendMessage,
  disabled = false,
  placeholder = 'Napisz wiadomość...',
}: InputAreaProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmedText = text.trim();
    if (!trimmedText || disabled) return;

    onSendMessage(trimmedText);
    setText(''); // Clear input after sending
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      {/* Text input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          minHeight: '40px',
          maxHeight: '120px',
        }}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        aria-label="Wyślij wiadomość"
      >
        Wyślij
      </button>
    </div>
  );
}
