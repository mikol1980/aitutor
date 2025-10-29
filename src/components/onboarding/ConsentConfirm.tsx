// ============================================================================
// Consent Confirm Component
// ============================================================================
// Checkbox for user consent to complete tutorial
// Visible only on last step (step 3)

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConsentConfirmProps {
  /**
   * Checkbox checked state
   */
  checked: boolean;

  /**
   * Change handler
   */
  onChange: (checked: boolean) => void;

  /**
   * Disabled state (during save)
   */
  disabled?: boolean;
}

/**
 * Consent confirm component
 * Displays checkbox with explanation text:
 * "Rozumiem, że mogę wrócić do samouczka w każdej chwili z ustawień profilu."
 */
export function ConsentConfirm({ checked, onChange, disabled = false }: ConsentConfirmProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <div className={cn("rounded-lg border border-border bg-muted/50 p-4", disabled && "opacity-50")}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          id="consent-checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "mt-0.5 h-4 w-4 flex-shrink-0 rounded border-input",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          aria-describedby="consent-description"
        />

        {/* Label and description */}
        <div className="flex-1">
          <Label htmlFor="consent-checkbox" className={cn("cursor-pointer text-sm", disabled && "cursor-not-allowed")}>
            Potwierdzam ukończenie samouczka
          </Label>
          <p id="consent-description" className="mt-1 text-xs text-muted-foreground">
            Możesz wrócić do samouczka w każdej chwili z ustawień profilu.
          </p>
        </div>
      </div>
    </div>
  );
}
