// ============================================================================
// Auth Error Component
// ============================================================================
// Displays authentication errors in a consistent way

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AuthErrorProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * Component for displaying authentication errors
 * Provides consistent error display with optional dismiss functionality
 */
export function AuthError({ message, onDismiss }: AuthErrorProps) {
  return (
    <Alert variant="destructive" className="relative">
      <AlertDescription className="pr-8">
        {message}
      </AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onDismiss}
          aria-label="Zamknij"
        >
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Button>
      )}
    </Alert>
  );
}
