// ============================================================================
// Theme Toggle Component
// ============================================================================
// Theme selection control (system/light/dark)

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ThemeMode } from '@/lib/types/profile-view.types';

interface ThemeToggleProps {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
}

/**
 * Theme toggle component
 * Allows selecting between system, light, and dark themes
 */
export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="theme-select">Motyw</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="theme-select">
          <SelectValue placeholder="Wybierz motyw" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">Systemowy</SelectItem>
          <SelectItem value="light">Jasny</SelectItem>
          <SelectItem value="dark">Ciemny</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Wybierz preferowany motyw interfejsu
      </p>
    </div>
  );
}

