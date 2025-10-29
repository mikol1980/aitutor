// ============================================================================
// Tutorial Section Component
// ============================================================================
// Section for tutorial information and restart link

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

interface TutorialSectionProps {
  hasCompleted: boolean;
}

/**
 * Tutorial section
 * Shows tutorial status and restart option
 */
export function TutorialSection({ hasCompleted }: TutorialSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Samouczek</CardTitle>
        <CardDescription>
          {hasCompleted 
            ? 'Ukończyłeś samouczek. Możesz go powtórzyć w dowolnym momencie.'
            : 'Samouczek pomoże Ci poznać podstawowe funkcje aplikacji.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" asChild>
          <a href="/onboarding" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {hasCompleted ? 'Powtórz samouczek' : 'Rozpocznij samouczek'}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

