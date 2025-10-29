// ============================================================================
// Profile Details Card Component
// ============================================================================
// Displays user profile information

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProfileViewModel } from '@/lib/types/profile-view.types';

interface ProfileDetailsCardProps {
  profile: ProfileViewModel;
}

/**
 * Profile details card
 * Shows login, email, tutorial status, and creation date
 */
export function ProfileDetailsCard({ profile }: ProfileDetailsCardProps) {
  const formattedDate = new Date(profile.createdAtIso).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane konta</CardTitle>
        <CardDescription>
          Informacje o Twoim koncie w systemie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm font-medium">Login</span>
            <span className="text-sm text-muted-foreground">{profile.login}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm font-medium">Email</span>
            <span className="text-sm text-muted-foreground">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm font-medium">Status samouczka</span>
            <Badge variant={profile.hasCompletedTutorial ? 'default' : 'secondary'}>
              {profile.hasCompletedTutorial ? 'Ukończony' : 'Nieukończony'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Data utworzenia</span>
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

