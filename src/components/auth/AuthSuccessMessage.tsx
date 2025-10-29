// ============================================================================
// Auth Success Message Component
// ============================================================================
// Displays authentication success messages in a consistent way

import { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthSuccessMessageProps {
  message: string;
  autoDismiss?: boolean;
  dismissTimeout?: number; // milliseconds
  onDismiss?: () => void;
}

/**
 * Component for displaying authentication success messages
 * Supports auto-dismiss after a specified timeout
 */
export function AuthSuccessMessage({
  message,
  autoDismiss = false,
  dismissTimeout = 5000,
  onDismiss,
}: AuthSuccessMessageProps) {
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, dismissTimeout);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissTimeout, onDismiss]);

  return (
    <Alert variant="success">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
