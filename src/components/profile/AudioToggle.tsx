// ============================================================================
// Audio Toggle Component
// ============================================================================
// Audio enable/disable control

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AudioToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Audio toggle component
 * Switch for enabling/disabling audio features
 */
export function AudioToggle({ value, onChange }: AudioToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="audio-switch">Dźwięk</Label>
        <p className="text-xs text-muted-foreground">
          Włącz lub wyłącz funkcje audio
        </p>
      </div>
      <Switch 
        id="audio-switch" 
        checked={value} 
        onCheckedChange={onChange}
        aria-label="Przełącznik dźwięku"
      />
    </div>
  );
}

