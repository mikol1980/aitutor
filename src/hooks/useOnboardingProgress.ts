import { useState, useEffect, useCallback } from "react";
import type {
  OnboardingStep,
  OnboardingStateVM,
  ONBOARDING_STORAGE_KEY,
  UpdateProfileCommand,
  ProfileDTO,
} from "@/types";

const STORAGE_KEY: typeof ONBOARDING_STORAGE_KEY = "onboarding.step";
const TOTAL_STEPS = 4;

/**
 * Hook result interface
 */
export interface UseOnboardingProgressResult {
  state: OnboardingStateVM;
  goNext: () => void;
  goPrev: () => void;
  skip: () => void;
  setConsent: (value: boolean) => void;
  finish: () => Promise<void>;
}

/**
 * Custom hook for managing onboarding progress
 * Handles:
 * - Step navigation with sessionStorage persistence
 * - canSkip logic (available from step 2)
 * - Consent management for finishing
 * - Profile update via PUT /api/profile
 */
export function useOnboardingProgress(initialStep: number = 0): UseOnboardingProgressResult {
  const [state, setState] = useState<OnboardingStateVM>({
    currentStep: initialStep as OnboardingStep,
    totalSteps: TOTAL_STEPS,
    canSkip: initialStep >= 2,
    isSavingProfile: false,
    hasConsentToFinish: false,
  });

  // Initialize from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const step = parseInt(stored, 10);
        if (step >= 0 && step <= 3) {
          setState((prev) => ({
            ...prev,
            currentStep: step as OnboardingStep,
            canSkip: step >= 2,
          }));
        }
      }
    } catch (error) {
      // sessionStorage not available (private mode) - use in-memory state
      console.warn("sessionStorage not available:", error);
    }
  }, []);

  // Save to sessionStorage when step changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, state.currentStep.toString());
    } catch (error) {
      // Silently fail if sessionStorage not available
      console.warn("Could not save to sessionStorage:", error);
    }
  }, [state.currentStep]);

  /**
   * Navigate to next step
   */
  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep < 3) {
        const nextStep = (prev.currentStep + 1) as OnboardingStep;
        return {
          ...prev,
          currentStep: nextStep,
          canSkip: nextStep >= 2,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Navigate to previous step
   */
  const goPrev = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep > 0) {
        const prevStep = (prev.currentStep - 1) as OnboardingStep;
        return {
          ...prev,
          currentStep: prevStep,
          canSkip: prevStep >= 2,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Skip tutorial (available from step 2)
   * Does NOT set has_completed_tutorial flag
   * Allows user to return to tutorial later
   */
  const skip = useCallback(() => {
    if (state.canSkip) {
      // Clear sessionStorage
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("Could not clear sessionStorage:", error);
      }
      // Redirect to /app
      window.location.href = "/app";
    }
  }, [state.canSkip]);

  /**
   * Set consent for finishing tutorial
   */
  const setConsent = useCallback((value: boolean) => {
    setState((prev) => ({
      ...prev,
      hasConsentToFinish: value,
    }));
  }, []);

  /**
   * Finish tutorial
   * Updates profile with has_completed_tutorial = true
   * Clears sessionStorage and redirects to /app
   */
  const finish = useCallback(async () => {
    if (!state.hasConsentToFinish) {
      return;
    }

    setState((prev) => ({ ...prev, isSavingProfile: true }));

    try {
      // Call PUT /api/profile
      const command: UpdateProfileCommand = {
        has_completed_tutorial: true,
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || "Nie udało się zaktualizować profilu");
      }

      const profile: ProfileDTO = await response.json();

      // Clear sessionStorage
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("Could not clear sessionStorage:", error);
      }

      // Redirect to /app
      window.location.href = "/app";
    } catch (error) {
      setState((prev) => ({ ...prev, isSavingProfile: false }));

      // Show user-friendly error
      const message = error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania postępu";

      // TODO: Show toast notification
      alert(message);
      throw error;
    }
  }, [state.hasConsentToFinish]);

  return {
    state,
    goNext,
    goPrev,
    skip,
    setConsent,
    finish,
  };
}
