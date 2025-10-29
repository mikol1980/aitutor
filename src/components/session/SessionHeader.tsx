// ============================================================================
// Session Header Component
// ============================================================================
// Header for session view with topic title, status badge, and end button

import { Badge } from '@/components/ui/badge';

interface SessionHeaderProps {
  topicTitle: string;
  isActive: boolean;
  onEndSession: () => void;
}

/**
 * Session header component
 * Displays topic title, session status, and end session button
 */
export function SessionHeader({
  topicTitle,
  isActive,
  onEndSession,
}: SessionHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-4xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Topic title and status */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {topicTitle}
            </h1>
            {isActive ? (
              <Badge variant="default" className="bg-green-600 text-white">
                Aktywna
              </Badge>
            ) : (
              <Badge variant="secondary">Zakończona</Badge>
            )}
          </div>

          {/* End session button - only show if active */}
          {isActive && (
            <button
              onClick={onEndSession}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Zakończ sesję
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
