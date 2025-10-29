// ============================================================================
// Profile API Client
// ============================================================================
// Client-side API functions for profile endpoints

import type { ProfileDTO, ApiErrorResponseDTO } from '@/types';
import type { ProfileViewModel, ApiErrorUiModel } from '@/lib/types/profile-view.types';

/**
 * Map ProfileDTO to ProfileViewModel
 * Converts snake_case to camelCase
 */
function mapProfileDtoToViewModel(dto: ProfileDTO): ProfileViewModel {
  return {
    id: dto.id,
    login: dto.login,
    email: dto.email,
    hasCompletedTutorial: dto.has_completed_tutorial,
    createdAtIso: dto.created_at,
  };
}

/**
 * Fetch user profile from API
 * Uses cookies for authentication (set by middleware)
 * @throws ApiErrorUiModel on error
 */
export async function fetchProfile(): Promise<ProfileViewModel> {
  const res = await fetch('/api/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin', // Include cookies
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
        message: 'Unknown error occurred',
      };
    }

    throw error;
  }

  const dto: ProfileDTO = await res.json();
  return mapProfileDtoToViewModel(dto);
}
