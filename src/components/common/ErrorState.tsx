// ============================================================================
// Error State Component
// ============================================================================
// Reusable error display with retry option

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Error state component
 * Shows error message with optional retry button
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <h3 className="text-lg font-semibold">Wystąpił błąd</h3>
      </div>
      <p className="text-center text-sm text-muted-foreground max-w-md">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}

