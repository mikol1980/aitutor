// ============================================================================
// Section Card Component
// ============================================================================
// Displays a single section with title, description, and progress indicator

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardSectionVM } from "@/lib/types/dashboard-view.types";

interface SectionCardProps {
  section: DashboardSectionVM;
}

/**
 * Section card component
 * Shows section information with visual progress indicator
 */
export function SectionCard({ section }: SectionCardProps) {
  const { title, description, progress } = section;

  return (
    <a
      href={`/app/sections/${section.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl transition-transform hover:scale-[1.02]"
      aria-label={`Przejdź do sekcji: ${title}`}
    >
      <Card className="h-full transition-shadow group-hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription className="line-clamp-2">{description}</CardDescription>}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Postęp</span>
              <span className="font-semibold">{progress.percentCompleted}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percentCompleted}%` }}
                role="progressbar"
                aria-valuenow={progress.percentCompleted}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Postęp: ${progress.percentCompleted}%`}
              />
            </div>
          </div>

          {/* Progress badges */}
          <div className="flex flex-wrap gap-2">
            {progress.completed > 0 && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Ukończone: {progress.completed}
              </Badge>
            )}
            {progress.inProgress > 0 && <Badge variant="secondary">W trakcie: {progress.inProgress}</Badge>}
            {progress.notStarted > 0 && <Badge variant="outline">Nierozpoczęte: {progress.notStarted}</Badge>}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
