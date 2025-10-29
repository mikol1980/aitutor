// ============================================================================
// Onboarding App Component
// ============================================================================
// Main container for onboarding flow
// Initializes state from sessionStorage and provides ARIA live region

import { useEffect, useState } from "react";
import { OnboardingWizard } from "./OnboardingWizard";
import { ONBOARDING_STORAGE_KEY } from "@/types";

/**
 * Onboarding app component
 * Handles:
 * - SSR/hydration safety
 * - Initial step from sessionStorage
 * - Global aria-live region for step announcements
 */
export function OnboardingApp() {
  const [isClient, setIsClient] = useState(false);
  const [initialStep, setInitialStep] = useState(0);

  // Ensure client-side only rendering to avoid SSR/hydration mismatch
  useEffect(() => {
    setIsClient(true);

    // Read initial step from sessionStorage
    try {
      const stored = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const step = parseInt(stored, 10);
        if (step >= 0 && step <= 3) {
          setInitialStep(step);
        }
      }
    } catch (error) {
      console.warn("Could not read from sessionStorage:", error);
    }
  }, []);

  // Don't render until client-side
  if (!isClient) {
    return null;
  }

  const handleCompleted = () => {
    // Redirect to /app after successful completion
    window.location.href = "/app";
  };

  return (
    <div className="min-h-screen w-full">
      {/* ARIA live region for step change announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="onboarding-announcer" />

      <OnboardingWizard initialStep={initialStep} onCompleted={handleCompleted} />
    </div>
  );
}
