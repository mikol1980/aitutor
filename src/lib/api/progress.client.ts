// ============================================================================
// Progress API Client
// ============================================================================
// Client-side API functions for user progress endpoints

import type {
  UserProgressOverviewResponseDTO,
  UserProgressWithDetailsDTO,
  UserProgressSummaryDTO,
  ApiErrorResponseDTO,
} from '@/types';
import type {
  UserProgressOverviewViewModel,
  UserProgressItemViewModel,
  UserProgressSummaryViewModel,
  ProgressFilters,
} from '@/lib/types/progress-view.types';
import type { ApiErrorUiModel } from '@/lib/types/profile-view.types';

/**
 * Map UserProgressWithDetailsDTO to UserProgressItemViewModel
 * Converts snake_case to camelCase for frontend consumption
 */
function mapProgressItemDtoToViewModel(
  dto: UserProgressWithDetailsDTO
): UserProgressItemViewModel {
  return {
    userId: dto.user_id,
    sectionId: dto.section_id,
    sectionTitle: dto.section_title,
    topicId: dto.topic_id,
    topicTitle: dto.topic_title,
    status: dto.status,
    score: dto.score,
    updatedAtIso: dto.updated_at,
  };
}

/**
 * Map UserProgressSummaryDTO to UserProgressSummaryViewModel
 * Converts snake_case to camelCase for frontend consumption
 */
function mapSummaryDtoToViewModel(
  dto: UserProgressSummaryDTO
): UserProgressSummaryViewModel {
  return {
    totalTopics: dto.total_topics,
    completed: dto.completed,
    inProgress: dto.in_progress,
    notStarted: dto.not_started,
  };
}

/**
 * Build query string from filters
 */
function buildQueryString(filters: ProgressFilters): string {
  const params = new URLSearchParams();

  if (filters.sectionId) {
    params.append('section_id', filters.sectionId);
  }

  if (filters.status) {
    params.append('status', filters.status);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch user progress overview from API
 * Uses cookies for authentication (set by middleware)
 *
 * @param filters - Optional filters for section and status
 * @returns UserProgressOverviewViewModel with progress array and summary
 * @throws ApiErrorUiModel on error
 *
 * @example
 * // Fetch all progress
 * const overview = await fetchUserProgress({});
 *
 * @example
 * // Filter by section
 * const overview = await fetchUserProgress({ sectionId: 'uuid' });
 *
 * @example
 * // Filter by status
 * const overview = await fetchUserProgress({ status: 'completed' });
 */
export async function fetchUserProgress(
  filters: ProgressFilters = {}
): Promise<UserProgressOverviewViewModel> {
  const queryString = buildQueryString(filters);
  const url = `/api/user-progress${queryString}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin', // Include cookies for authentication
  });

  if (!res.ok) {
    let error: ApiErrorUiModel;

    try {
      const errorResponse: ApiErrorResponseDTO = await res.json();
      error = {
        code: errorResponse.error.code,
        message: errorResponse.error.message,
      };
    } catch {
      // Fallback if response is not JSON
      error = {
        code: 'INTERNAL_ERROR',
        message: 'Nie udało się pobrać postępów. Spróbuj ponownie później.',
      };
    }

    throw error;
  }

  const dto: UserProgressOverviewResponseDTO = await res.json();

  // Map DTOs to ViewModels
  return {
    progress: dto.progress.map(mapProgressItemDtoToViewModel),
    summary: mapSummaryDtoToViewModel(dto.summary),
  };
}
