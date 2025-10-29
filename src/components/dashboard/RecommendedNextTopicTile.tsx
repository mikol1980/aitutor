// ============================================================================
// Recommended Next Topic Tile Component
// ============================================================================
// Shortcut tile suggesting the next topic to study

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import type { RecommendedTopicVM } from "@/lib/types/dashboard-view.types";

interface RecommendedNextTopicTileProps {
  recommendation: RecommendedTopicVM;
}

/**
 * Recommended next topic tile component
 * Suggests the next topic for the user to study
 */
export function RecommendedNextTopicTile({ recommendation }: RecommendedNextTopicTileProps) {
  const { sectionId, sectionTitle, topicTitle } = recommendation;

  return (
    <Card className="h-full bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg">Rekomendowany temat</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">{sectionTitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm font-medium">{topicTitle}</p>

        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <a href={`/app/sections/${sectionId}`}>Przejdź do sekcji</a>
        </Button>
      </CardContent>
    </Card>
  );
}
