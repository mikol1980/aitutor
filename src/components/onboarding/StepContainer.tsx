// ============================================================================
// Step Container Component
// ============================================================================
// Container that renders appropriate step content based on currentStep

import type { OnboardingStep } from "@/types";
import { StepIntro } from "./steps/StepIntro";
import { StepConversationDemo } from "./steps/StepConversationDemo";
import { StepFormulaDemo } from "./steps/StepFormulaDemo";
import { StepProgressMap } from "./steps/StepProgressMap";

interface StepContainerProps {
  /**
   * Current step to display (0-3)
   */
  currentStep: OnboardingStep;
}

/**
 * Step container component
 * Renders content for current step:
 * 0 - Welcome/Intro
 * 1 - AI Conversation Demo
 * 2 - Formula Input Demo
 * 3 - Progress Map Demo
 *
 * Uses conditional rendering to mount/unmount step components
 * for proper cleanup and initialization
 */
export function StepContainer({ currentStep }: StepContainerProps) {
  return (
    <div role="region" aria-label={`Krok ${currentStep + 1}`} className="w-full">
      {currentStep === 0 && <StepIntro />}
      {currentStep === 1 && <StepConversationDemo />}
      {currentStep === 2 && <StepFormulaDemo />}
      {currentStep === 3 && <StepProgressMap />}
    </div>
  );
}
