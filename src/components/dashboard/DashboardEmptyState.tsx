// ============================================================================
// Dashboard Empty State Component
// ============================================================================
// Displays when no sections are available

import { BookOpen } from "lucide-react";

/**
 * Dashboard empty state component
 * Shows a message when no sections are available
 */
export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="rounded-full bg-muted p-6">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Brak dostępnych sekcji</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Wygląda na to, że nie masz jeszcze dostępu do żadnych sekcji nauki. Skontaktuj się z administratorem, aby
          uzyskać dostęp.
        </p>
      </div>
    </div>
  );
}
