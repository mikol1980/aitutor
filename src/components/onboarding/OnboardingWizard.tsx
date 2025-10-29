// ============================================================================
// Onboarding Wizard Component
// ============================================================================
// Core orchestrator for onboarding flow
// Handles step navigation, progress state, and accessibility

import { useEffect, useRef } from "react";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { ProgressBar } from "./ProgressBar";
import { StepControls } from "./StepControls";
import { ConsentConfirm } from "./ConsentConfirm";
import { StepContainer } from "./StepContainer";
import type { OnboardingStep } from "@/types";

interface OnboardingWizardProps {
  /**
   * Initial step (0-3)
   * Usually restored from sessionStorage
   */
  initialStep?: number;

  /**
   * Callback when tutorial is completed successfully
   */
  onCompleted?: () => void;
}

/**
 * Onboarding wizard component
 * Main orchestrator for 4-step tutorial flow:
 * 0. Welcome/Intro
 * 1. Conversation Demo
 * 2. Formula Demo
 * 3. Progress Map Demo
 */
export function OnboardingWizard({ initialStep = 0, onCompleted }: OnboardingWizardProps) {
  const { state, goNext, goPrev, skip, setConsent, finish } = useOnboardingProgress(initialStep);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<OnboardingStep>(state.currentStep);

  // Focus management on step change
  useEffect(() => {
    if (prevStepRef.current !== state.currentStep) {
      // Announce step change to screen readers
      const announcer = document.getElementById("onboarding-announcer");
      if (announcer) {
        announcer.textContent = `Krok ${state.currentStep + 1} z ${state.totalSteps}`;
      }

      // Focus on container for keyboard navigation
      if (containerRef.current) {
        containerRef.current.focus();
      }

      prevStepRef.current = state.currentStep;
    }
  }, [state.currentStep, state.totalSteps]);

  // Handle finish with callback
  const handleFinish = async () => {
    try {
      await finish();
      onCompleted?.();
    } catch (error) {
      // Error already handled in hook with alert
      console.error("Failed to finish onboarding:", error);
    }
  };

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === 3;
  const showConsentConfirm = isLastStep;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="flex min-h-screen w-full flex-col"
      role="region"
      aria-label="Samouczek wprowadzający"
    >
      {/* Header with progress bar */}
      <header className="border-b bg-card">
        <div className="container max-w-5xl py-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Samouczek</h1>
            <span className="text-sm text-muted-foreground">
              Krok {state.currentStep + 1} z {state.totalSteps}
            </span>
          </div>

          <ProgressBar currentStep={state.currentStep} totalSteps={state.totalSteps} />
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 bg-background">
        <div className="container max-w-5xl py-8">
          <StepContainer currentStep={state.currentStep} />
        </div>
      </main>

      {/* Footer with controls and consent */}
      <footer className="border-t bg-card">
        <div className="container max-w-5xl py-6">
          <div className="space-y-4">
            {/* Consent checkbox on last step */}
            {showConsentConfirm && (
              <ConsentConfirm
                checked={state.hasConsentToFinish}
                onChange={setConsent}
                disabled={state.isSavingProfile}
              />
            )}

            {/* Navigation controls */}
            <StepControls
              currentStep={state.currentStep}
              totalSteps={state.totalSteps}
              canSkip={state.canSkip}
              isSaving={state.isSavingProfile}
              hasConsent={state.hasConsentToFinish}
              onPrev={goPrev}
              onNext={goNext}
              onSkip={skip}
              onFinish={handleFinish}
              disablePrev={isFirstStep}
              disableNext={false}
              disableFinish={!state.hasConsentToFinish || state.isSavingProfile}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
