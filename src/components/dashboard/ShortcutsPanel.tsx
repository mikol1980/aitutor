// ============================================================================
// Shortcuts Panel Component
// ============================================================================
// Displays shortcut tiles for quick access to sessions and recommended topics

import { ContinueLastSessionTile } from "./ContinueLastSessionTile";
import { RecommendedNextTopicTile } from "./RecommendedNextTopicTile";
import type { LastSessionVM, RecommendedTopicVM } from "@/lib/types/dashboard-view.types";

interface ShortcutsPanelProps {
  lastSession?: LastSessionVM;
  recommended?: RecommendedTopicVM;
}

/**
 * Shortcuts panel component
 * Displays conditional tiles for last session and recommended topic
 */
export function ShortcutsPanel({ lastSession, recommended }: ShortcutsPanelProps) {
  // Don't render if no shortcuts available
  if (!lastSession && !recommended) {
    return null;
  }

  return (
    <section aria-label="Skróty" className="space-y-4">
      <h2 className="text-xl font-semibold">Szybki start</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lastSession && <ContinueLastSessionTile session={lastSession} />}

        {recommended && <RecommendedNextTopicTile recommendation={recommended} />}
      </div>
    </section>
  );
}
