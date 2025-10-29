// ============================================================================
// Profile View Types
// ============================================================================
// View models and types specific to the profile view frontend

/**
 * Theme mode options for UI preferences
 */
export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * User preferences view model
 * Stored in localStorage, no sensitive data
 */
export interface PreferencesViewModel {
  theme: ThemeMode; // UI theme selection
  audioEnabled: boolean; // audio feature flag
}

/**
 * Profile view model
 * Mapped from ProfileDTO with camelCase naming
 */
export interface ProfileViewModel {
  id: string;
  login: string;
  email: string;
  hasCompletedTutorial: boolean;
  createdAtIso: string;
}

/**
 * API error UI model
 * User-friendly error representation
 */
export interface ApiErrorUiModel {
  code: string;
  message: string;
}

/**
 * Profile state type for useProfile hook
 */
export interface ProfileState {
  data?: ProfileViewModel;
  loading: boolean;
  error?: ApiErrorUiModel;
}

/**
 * Preferences state type for usePreferences hook
 */
export interface PreferencesState {
  preferences: PreferencesViewModel;
  setPreferences: (preferences: PreferencesViewModel) => void;
  resetPreferences: () => void;
}

