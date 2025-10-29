// ============================================================================
// Dashboard API Client
// ============================================================================
// Client-side API functions for dashboard data fetching

import type {
  SectionListResponseDTO,
  UserProgressOverviewResponseDTO,
  SessionDetailsDTO,
  ApiErrorResponseDTO,
} from "@/types";

/**
 * Standardized API error type for client-side
 */
export interface ApiClientError {
  code: string;
  message: string;
}

/**
 * Fetch all sections
 * @throws ApiClientError on error
 */
export async function fetchSections(): Promise<SectionListResponseDTO> {
  const res = await fetch("/api/sections", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });

  if (!res.ok) {
    const error = await parseApiError(res);
    throw error;
  }

  return res.json();
}

/**
 * Fetch user progress overview
 * @param sectionId - Optional section filter
 * @param status - Optional status filter
 * @throws ApiClientError on error
 */
export async function fetchUserProgress(sectionId?: string, status?: string): Promise<UserProgressOverviewResponseDTO> {
  const params = new URLSearchParams();
  if (sectionId) params.append("section_id", sectionId);
  if (status) params.append("status", status);

  const url = `/api/user-progress${params.toString() ? `?${params.toString()}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });

  if (!res.ok) {
    const error = await parseApiError(res);
    throw error;
  }

  return res.json();
}

/**
 * Fetch session details for validation
 * @param sessionId - UUID of the session
 * @throws ApiClientError on error (including 404 if session not found)
 */
export async function fetchSessionDetails(sessionId: string): Promise<SessionDetailsDTO> {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });

  if (!res.ok) {
    const error = await parseApiError(res);
    throw error;
  }

  return res.json();
}

/**
 * Parse API error response
 * Attempts to extract error from JSON response, falls back to generic error
 */
async function parseApiError(res: Response): Promise<ApiClientError> {
  try {
    const errorResponse: ApiErrorResponseDTO = await res.json();
    return {
      code: errorResponse.error.code,
      message: errorResponse.error.message,
    };
  } catch {
    // Fallback if response is not JSON
    return {
      code: "INTERNAL_ERROR",
      message: "Wystąpił nieoczekiwany błąd",
    };
  }
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
