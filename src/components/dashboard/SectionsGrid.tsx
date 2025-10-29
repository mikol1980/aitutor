// ============================================================================
// Sections Grid Component
// ============================================================================
// Displays a responsive grid of section cards

import { SectionCard } from "./SectionCard";
import type { DashboardSectionVM } from "@/lib/types/dashboard-view.types";

interface SectionsGridProps {
  sections: DashboardSectionVM[];
}

/**
 * Sections grid component
 * Renders section cards in a responsive grid layout
 */
export function SectionsGrid({ sections }: SectionsGridProps) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Brak sekcji do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Lista sekcji">
      {sections.map((section) => (
        <div key={section.id} role="listitem">
          <SectionCard section={section} />
        </div>
      ))}
    </div>
  );
}
