// ============================================================================
// usePreferences Hook
// ============================================================================
// Manages user UI preferences with localStorage persistence

import { useState, useEffect, useCallback } from 'react';
import type { PreferencesViewModel, ThemeMode, PreferencesState } from '@/lib/types/profile-view.types';

const STORAGE_KEYS = {
  THEME: 'aitutor:theme',
  AUDIO_ENABLED: 'aitutor:audioEnabled',
} as const;

const DEFAULT_PREFERENCES: PreferencesViewModel = {
  theme: 'system',
  audioEnabled: true,
};

/**
 * Apply theme to document
 * Adds/removes 'dark' class based on theme preference
 */
function applyTheme(theme: ThemeMode) {
  // Guard against SSR
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System theme - check OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

/**
 * Load preferences from localStorage
 */
function loadPreferences(): PreferencesViewModel {
  // Guard against SSR
  if (typeof localStorage === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const theme = (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || DEFAULT_PREFERENCES.theme;
    const audioEnabled = localStorage.getItem(STORAGE_KEYS.AUDIO_ENABLED) === 'true';

    return {
      theme,
      audioEnabled: audioEnabled ?? DEFAULT_PREFERENCES.audioEnabled,
    };
  } catch (error) {
    console.error('Failed to load preferences from localStorage:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save preferences to localStorage
 */
function savePreferences(preferences: PreferencesViewModel) {
  // Guard against SSR
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.THEME, preferences.theme);
    localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, String(preferences.audioEnabled));
  } catch (error) {
    console.error('Failed to save preferences to localStorage:', error);
  }
}

/**
 * Custom hook for managing user preferences
 * Handles theme, audio settings with localStorage persistence
 */
export function usePreferences(): PreferencesState {
  const [preferences, setPreferencesState] = useState<PreferencesViewModel>(loadPreferences);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  // Listen to system theme changes when in system mode
  useEffect(() => {
    if (preferences.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme]);

  const setPreferences = useCallback((newPreferences: PreferencesViewModel) => {
    setPreferencesState(newPreferences);
    savePreferences(newPreferences);
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferencesState(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    setPreferences,
    resetPreferences,
  };
}

