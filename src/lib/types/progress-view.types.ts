// ============================================================================
// Progress View Types
// ============================================================================
// View models and types specific to the user progress view frontend

import type { UserProgressStatus } from '@/types';
import type { ApiErrorUiModel } from './profile-view.types';

/**
 * User Progress Item View Model
 * Mapped from UserProgressWithDetailsDTO with camelCase naming
 */
export interface UserProgressItemViewModel {
  userId: string;
  sectionId: string;
  sectionTitle: string;
  topicId: string;
  topicTitle: string;
  status: UserProgressStatus;
  score: number | null;
  updatedAtIso: string | null;
}

/**
 * User Progress Summary View Model
 * Mapped from UserProgressSummaryDTO with camelCase naming
 */
export interface UserProgressSummaryViewModel {
  totalTopics: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

/**
 * User Progress Overview View Model
 * Complete progress data with summary statistics
 */
export interface UserProgressOverviewViewModel {
  progress: UserProgressItemViewModel[];
  summary: UserProgressSummaryViewModel;
}

/**
 * Progress filters for API calls
 */
export interface ProgressFilters {
  sectionId?: string;
  status?: UserProgressStatus;
}

/**
 * Progress state type for useUserProgress hook
 */
export interface ProgressState {
  data?: UserProgressOverviewViewModel;
  loading: boolean;
  error?: ApiErrorUiModel;
  filters: ProgressFilters;
}
