// ============================================================================
// Profile Header Component
// ============================================================================
// Header section for profile view

interface ProfileHeaderProps {
  userLogin?: string;
}

/**
 * Profile page header
 * Displays title and optional personalized greeting
 */
export function ProfileHeader({ userLogin }: ProfileHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">
        Profil {userLogin && `— ${userLogin}`}
      </h1>
      <p className="text-muted-foreground">
        Zarządzaj swoimi danymi i preferencjami aplikacji
      </p>
    </div>
  );
}

