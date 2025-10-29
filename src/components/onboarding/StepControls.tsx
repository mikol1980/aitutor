// ============================================================================
// Step Controls Component
// ============================================================================
// Navigation buttons for onboarding wizard
// Handles Prev/Next/Skip/Finish with conditional logic

import { Button } from "@/components/ui/button";
import type { OnboardingStep } from "@/types";

interface StepControlsProps {
  /**
   * Current step (0-3)
   */
  currentStep: OnboardingStep;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Whether skip button should be visible (step >= 2)
   */
  canSkip: boolean;

  /**
   * Whether save operation is in progress
   */
  isSaving: boolean;

  /**
   * Whether user has given consent to finish
   */
  hasConsent: boolean;

  /**
   * Navigate to previous step
   */
  onPrev: () => void;

  /**
   * Navigate to next step
   */
  onNext: () => void;

  /**
   * Skip tutorial (without setting completed flag)
   */
  onSkip: () => void;

  /**
   * Finish tutorial (set completed flag and redirect)
   */
  onFinish: () => void;

  /**
   * Disable previous button (first step)
   */
  disablePrev?: boolean;

  /**
   * Disable next button
   */
  disableNext?: boolean;

  /**
   * Disable finish button (no consent or saving)
   */
  disableFinish?: boolean;
}

/**
 * Step controls component
 * Responsive navigation buttons:
 * - Mobile: Stacked layout
 * - Desktop: Horizontal with space-between
 *
 * Button visibility logic:
 * - Prev: Hidden on step 0
 * - Next: Visible on steps 0-2
 * - Skip: Visible on steps 2-3 (canSkip = true)
 * - Finish: Visible only on step 3
 */
export function StepControls({
  currentStep,
  totalSteps,
  canSkip,
  isSaving,
  hasConsent,
  onPrev,
  onNext,
  onSkip,
  onFinish,
  disablePrev = false,
  disableNext = false,
  disableFinish = false,
}: StepControlsProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <nav
      aria-label="Nawigacja samouczka"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Left side: Previous button */}
      <div className="flex">
        {!isFirstStep && (
          <Button variant="outline" onClick={onPrev} disabled={disablePrev || isSaving} aria-label="Poprzedni krok">
            <span aria-hidden="true">←</span>
            <span className="ml-2">Poprzedni</span>
          </Button>
        )}
      </div>

      {/* Right side: Next/Skip/Finish buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Skip button (visible from step 2) */}
        {canSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isSaving}
            aria-label="Pomiń samouczek i przejdź do aplikacji"
          >
            Pomiń
          </Button>
        )}

        {/* Next button (steps 0-2) */}
        {!isLastStep && (
          <Button onClick={onNext} disabled={disableNext || isSaving} aria-label="Następny krok">
            <span>Następny</span>
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Button>
        )}

        {/* Finish button (step 3 only) */}
        {isLastStep && (
          <Button onClick={onFinish} disabled={disableFinish} aria-label="Zakończ samouczek" aria-busy={isSaving}>
            {isSaving ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Zapisywanie...</span>
              </>
            ) : (
              <span>Zakończ</span>
            )}
          </Button>
        )}
      </div>
    </nav>
  );
}
