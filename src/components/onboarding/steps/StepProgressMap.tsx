// ============================================================================
// Step Progress Map Component
// ============================================================================
// Demonstrates progress tracking feature (step 3)

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProgressLegendItemVM } from "@/types";

/**
 * Progress status type
 */
type ProgressStatus = "completed" | "in_progress" | "locked" | "available";

/**
 * Example topic for demo
 */
interface DemoTopic {
  id: string;
  title: string;
  status: ProgressStatus;
}

/**
 * Example section with topics
 */
interface DemoSection {
  id: string;
  title: string;
  topics: DemoTopic[];
}

/**
 * Demo data for sections
 */
const DEMO_SECTIONS: DemoSection[] = [
  {
    id: "algebra",
    title: "Algebra",
    topics: [
      { id: "eq-linear", title: "Równania liniowe", status: "completed" },
      { id: "eq-quadratic", title: "Równania kwadratowe", status: "in_progress" },
      { id: "systems", title: "Układy równań", status: "available" },
    ],
  },
  {
    id: "functions",
    title: "Funkcje",
    topics: [
      { id: "func-linear", title: "Funkcja liniowa", status: "locked" },
      { id: "func-quadratic", title: "Funkcja kwadratowa", status: "locked" },
    ],
  },
];

/**
 * Legend for progress colors
 */
const PROGRESS_LEGEND: ProgressLegendItemVM[] = [
  {
    label: "Ukończone",
    colorClass: "bg-green-500",
    ariaLabel: "Tematy ukończone oznaczone na zielono",
  },
  {
    label: "W trakcie",
    colorClass: "bg-blue-500",
    ariaLabel: "Tematy w trakcie nauki oznaczone na niebiesko",
  },
  {
    label: "Dostępne",
    colorClass: "bg-gray-300 dark:bg-gray-600",
    ariaLabel: "Tematy dostępne do rozpoczęcia oznaczone na szaro",
  },
  {
    label: "Zablokowane",
    colorClass: "bg-gray-200 dark:bg-gray-700",
    ariaLabel: "Tematy zablokowane do czasu ukończenia poprzednich",
  },
];

/**
 * Get badge variant for status
 */
function getStatusBadge(status: ProgressStatus): {
  variant: "default" | "secondary" | "outline" | "destructive";
  label: string;
} {
  switch (status) {
    case "completed":
      return { variant: "default", label: "✓ Ukończone" };
    case "in_progress":
      return { variant: "secondary", label: "→ W trakcie" };
    case "available":
      return { variant: "outline", label: "Dostępne" };
    case "locked":
      return { variant: "outline", label: "🔒 Zablokowane" };
  }
}

/**
 * Get color class for status
 */
function getStatusColorClass(status: ProgressStatus): string {
  switch (status) {
    case "completed":
      return "border-green-500 bg-green-50 dark:bg-green-950";
    case "in_progress":
      return "border-blue-500 bg-blue-50 dark:bg-blue-950";
    case "available":
      return "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900";
    case "locked":
      return "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 opacity-60";
  }
}

/**
 * Step 3: Progress Map Demo
 * Shows progress tracking visualization
 * Demonstrates:
 * - Sections and topics hierarchy
 * - Color-coded progress status
 * - Topic unlock logic
 */
export function StepProgressMap() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Mapa Twoich Postępów</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Śledź swój postęp w nauce. Tematy odblokowują się automatycznie po ukończeniu poprzednich.
          </p>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 text-sm font-semibold">Legenda:</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROGRESS_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-2" aria-label={item.ariaLabel}>
                <div className={cn("h-3 w-3 rounded-full", item.colorClass)} aria-hidden="true" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Map */}
      <div className="space-y-4">
        {DEMO_SECTIONS.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" role="list" aria-label={`Tematy w dziale ${section.title}`}>
                {section.topics.map((topic) => {
                  const badge = getStatusBadge(topic.status);
                  const colorClass = getStatusColorClass(topic.status);

                  return (
                    <div
                      key={topic.id}
                      role="listitem"
                      className={cn(
                        "flex items-center justify-between rounded-lg border-2 p-3 transition-colors",
                        colorClass
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Status indicator */}
                        <div
                          className={cn(
                            "h-4 w-4 flex-shrink-0 rounded-full",
                            topic.status === "completed" && "bg-green-500",
                            topic.status === "in_progress" && "bg-blue-500",
                            topic.status === "available" && "bg-gray-300 dark:bg-gray-600",
                            topic.status === "locked" && "bg-gray-200 dark:bg-gray-700"
                          )}
                          aria-hidden="true"
                        />

                        {/* Topic title */}
                        <span className={cn("font-medium", topic.status === "locked" && "text-muted-foreground")}>
                          {topic.title}
                        </span>
                      </div>

                      {/* Status badge */}
                      <Badge variant={badge.variant} className="ml-2">
                        {badge.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="mb-3 font-semibold">Jak działa system postępów?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden="true">📊</span>
              <span>Twój postęp jest automatycznie zapisywany po każdej sesji</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">🎯</span>
              <span>AI dostosowuje trudność pytań na podstawie Twojego poziomu</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">🔓</span>
              <span>Nowe tematy odblokowują się po ukończeniu poprzednich (70% opanowania)</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">🏆</span>
              <span>Zobacz pełną mapę swoich umiejętności w panelu "Postępy"</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Final call-to-action */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold">Gotowy na rozpoczęcie nauki?</h3>
            <p className="text-sm text-muted-foreground">
              Kliknij "Zakończ" poniżej, aby przejść do głównego panelu aplikacji.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
