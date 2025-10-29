// ============================================================================
// Profile Screen Component
// ============================================================================
// Main profile view container with state management

import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { usePreferences } from '@/hooks/usePreferences';
import { ProfileHeader } from './ProfileHeader';
import { ProfileDetailsCard } from './ProfileDetailsCard';
import { PreferencesForm } from './PreferencesForm';
import { TutorialSection } from './TutorialSection';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import type { ProfileViewModel } from '@/lib/types/profile-view.types';

// TEMPORARY: Mock data for testing without authentication
// TODO: Remove this when authentication is implemented
const MOCK_PROFILE: ProfileViewModel = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  login: 'testuser',
  email: 'test@example.com',
  hasCompletedTutorial: false,
  createdAtIso: new Date().toISOString(),
};

// TEMPORARY: Set to true to use mock data without authentication
const USE_MOCK_DATA = false;

/**
 * Profile screen component
 * Main container for profile view with data fetching and state management
 */
export function ProfileScreen() {
  const [mockProfile] = useState<ProfileViewModel>(MOCK_PROFILE);
  const { data: profile, loading, error, refetch, canRetry } = useProfile();
  const { preferences, setPreferences, resetPreferences } = usePreferences();

  // TEMPORARY: Use mock data if enabled
  const displayProfile = USE_MOCK_DATA ? mockProfile : profile;
  const displayLoading = USE_MOCK_DATA ? false : loading;
  const displayError = USE_MOCK_DATA ? undefined : error;

  // Loading state
  if (displayLoading && !displayProfile) {
    return (
      <div className="container max-w-4xl py-8">
        <LoadingState label="Ładowanie profilu..." />
      </div>
    );
  }

  // Error state
  if (displayError && !displayProfile) {
    const errorMessage = displayError.code === 'UNAUTHORIZED' 
      ? 'Brak autoryzacji. Zaloguj się ponownie.'
      : displayError.message || 'Nie udało się załadować profilu';

    return (
      <div className="container max-w-4xl py-8">
        <ErrorState 
          message={errorMessage}
          onRetry={canRetry ? refetch : undefined}
        />
      </div>
    );
  }

  // No profile data (should not happen if no error)
  if (!displayProfile) {
    return (
      <div className="container max-w-4xl py-8">
        <ErrorState message="Brak danych profilu" />
      </div>
    );
  }

  // Success state - render profile
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-8">
        <ProfileHeader userLogin={displayProfile.login} />
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <div className="space-y-6">
            <ProfileDetailsCard profile={displayProfile} />
            <TutorialSection hasCompleted={displayProfile.hasCompletedTutorial} />
          </div>
          
          <div>
            <PreferencesForm 
              value={preferences}
              onChange={setPreferences}
              onReset={resetPreferences}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

