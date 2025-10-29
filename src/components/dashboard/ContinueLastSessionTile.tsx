// ============================================================================
// Continue Last Session Tile Component
// ============================================================================
// Shortcut tile to resume the user's last learning session

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import type { LastSessionVM } from "@/lib/types/dashboard-view.types";

interface ContinueLastSessionTileProps {
  session: LastSessionVM;
}

/**
 * Continue last session tile component
 * Displays information about the last session and allows resuming it
 */
export function ContinueLastSessionTile({ session }: ContinueLastSessionTileProps) {
  const { id, topicTitle, endedAt, isActive } = session;

  // Format date if session ended
  const formattedDate = endedAt
    ? new Date(endedAt).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card className="h-full bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-lg">{isActive ? "Kontynuuj sesję" : "Ostatnia sesja"}</CardTitle>
        </div>
        <CardDescription>{topicTitle || "Temat nieznany"}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {formattedDate && <p className="text-sm text-muted-foreground">Zakończona: {formattedDate}</p>}

        <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <a href={`/app/sessions/${id}`}>{isActive ? "Kontynuuj" : "Zobacz sesję"}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
