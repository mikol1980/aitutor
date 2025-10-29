// ============================================================================
// Loading State Component
// ============================================================================
// Reusable loading indicator with skeleton or spinner

import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  label?: string;
  variant?: 'spinner' | 'skeleton';
}

/**
 * Loading state component
 * Shows loading indicator with optional label
 */
export function LoadingState({ label = 'Loading...', variant = 'skeleton' }: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    );
  }

  // Skeleton variant - profile card skeleton
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

