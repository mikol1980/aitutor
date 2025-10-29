// ============================================================================
// Preferences Form Component
// ============================================================================
// User preferences management form

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { AudioToggle } from './AudioToggle';
import type { PreferencesViewModel } from '@/lib/types/profile-view.types';

interface PreferencesFormProps {
  value: PreferencesViewModel;
  onChange: (preferences: PreferencesViewModel) => void;
  onReset?: () => void;
}

/**
 * Preferences form component
 * Manages UI preferences (theme, audio)
 */
export function PreferencesForm({ value, onChange, onReset }: PreferencesFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencje</CardTitle>
        <CardDescription>
          Dostosuj ustawienia interfejsu i funkcji aplikacji
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ThemeToggle 
          value={value.theme}
          onChange={(theme) => onChange({ ...value, theme })}
        />
        
        <AudioToggle 
          value={value.audioEnabled}
          onChange={(audioEnabled) => onChange({ ...value, audioEnabled })}
        />

        {onReset && (
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onReset}
              className="w-full sm:w-auto"
            >
              Przywróć domyślne
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

