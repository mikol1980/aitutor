// ============================================================================
// Dashboard Screen Component
// ============================================================================
// Main container for the dashboard view
// Fetches and displays sections, shortcuts, and handles loading/error states

import { useDashboardData } from "@/hooks/useDashboardData";
import { ShortcutsPanel } from "./ShortcutsPanel";
import { SectionsGrid } from "./SectionsGrid";
import { DashboardLoadingSkeletons } from "./DashboardLoadingSkeletons";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";

/**
 * Dashboard screen component
 * Main entry point for the dashboard view
 * Orchestrates data fetching and rendering of all dashboard sections
 */
export function DashboardScreen() {
  const { data, loading, error, isEmpty, refetch, canRetry } = useDashboardData();

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardLoadingSkeletons />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState message={error.message} onRetry={canRetry ? refetch : undefined} />
      </div>
    );
  }

  // Empty state (no sections)
  if (isEmpty || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardEmptyState />
      </div>
    );
  }

  // Success state - render dashboard content
  const { sections, lastSession, recommended } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Przegląd twoich postępów w nauce</p>
          </div>

          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <a href="/app/profile">Profil</a>
          </Button>
        </header>

        {/* Shortcuts panel (last session + recommended topic) */}
        {(lastSession || recommended) && <ShortcutsPanel lastSession={lastSession} recommended={recommended} />}

        {/* Sections grid */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Sekcje</h2>
          <SectionsGrid sections={sections} />
        </section>
      </div>
    </div>
  );
}
