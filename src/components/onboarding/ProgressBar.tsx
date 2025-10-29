// ============================================================================
// Progress Bar Component
// ============================================================================
// Visual indicator showing current step in 4-step onboarding flow

import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/types";

interface ProgressBarProps {
  /**
   * Current step (0-3)
   */
  currentStep: OnboardingStep;

  /**
   * Total number of steps
   */
  totalSteps: number;
}

/**
 * Progress bar component
 * Shows 4 segments with visual indication of:
 * - Completed steps (filled)
 * - Current step (highlighted)
 * - Upcoming steps (empty)
 */
export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div
      role="progressbar"
      aria-label="Postęp samouczka"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuetext={`Krok ${currentStep + 1} z ${totalSteps}`}
      className="w-full"
    >
      {/* Visual progress bar */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index as OnboardingStep;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div
              key={stepNumber}
              className={cn("h-2 flex-1 rounded-full transition-colors duration-300", {
                "bg-primary": isCompleted || isCurrent,
                "bg-primary/20": isUpcoming,
              })}
              aria-label={`Krok ${stepNumber + 1}${
                isCurrent ? " (aktualny)" : isCompleted ? " (ukończony)" : " (nadchodzący)"
              }`}
            />
          );
        })}
      </div>

      {/* Text indicator for screen readers only */}
      <div className="sr-only">
        Postęp: {progressPercentage.toFixed(0)}%. Krok {currentStep + 1} z {totalSteps}.
      </div>
    </div>
  );
}
