// ============================================================================
// Sessions API Client
// ============================================================================
// Client-side API functions for session endpoints

import type {
  SessionDetailsDTO,
  SessionMessageDTO,
  SessionMessageListResponseDTO,
  CreateSessionMessageCommand,
  ApiErrorResponseDTO,
} from '@/types';
import type {
  SessionViewModel,
  SessionMessageViewModel,
  ApiErrorUiModel,
} from '@/lib/types/session-view.types';
import {
  mapSessionDetailsDtoToVm,
  mapSessionMessageDtoToVm,
} from '@/lib/types/session-view.types';

/**
 * Parse API error response
 * @throws ApiErrorUiModel
 */
async function handleApiError(res: Response): Promise<never> {
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
      message: 'Nieznany błąd',
    };
  }

  throw error;
}

/**
 * Fetch session details from API
 * GET /api/sessions/{sessionId}
 * @throws ApiErrorUiModel on error
 */
export async function fetchSessionDetails(sessionId: string): Promise<SessionViewModel> {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin', // Include cookies
  });

  if (!res.ok) {
    await handleApiError(res);
  }

  const dto: SessionDetailsDTO = await res.json();
  return mapSessionDetailsDtoToVm(dto);
}

/**
 * Query parameters for fetching session messages
 */
export interface FetchSessionMessagesQuery {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

/**
 * Response type for fetching session messages
 */
export interface FetchSessionMessagesResponse {
  messages: SessionMessageViewModel[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch session messages from API
 * GET /api/sessions/{sessionId}/messages?limit=50&offset=0&order=asc
 * @throws ApiErrorUiModel on error
 */
export async function fetchSessionMessages(
  sessionId: string,
  query?: FetchSessionMessagesQuery
): Promise<FetchSessionMessagesResponse> {
  // Build query params
  const params = new URLSearchParams();
  if (query?.limit !== undefined) params.set('limit', query.limit.toString());
  if (query?.offset !== undefined) params.set('offset', query.offset.toString());
  if (query?.order) params.set('order', query.order);

  const url = `/api/sessions/${sessionId}/messages${params.toString() ? `?${params.toString()}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin', // Include cookies
  });

  if (!res.ok) {
    await handleApiError(res);
  }

  const dto: SessionMessageListResponseDTO = await res.json();

  return {
    messages: dto.messages.map(mapSessionMessageDtoToVm),
    total: dto.pagination.total,
    limit: dto.pagination.limit,
    offset: dto.pagination.offset,
  };
}

/**
 * Post a new message to session
 * POST /api/sessions/{sessionId}/messages
 * @throws ApiErrorUiModel on error
 */
export async function postSessionMessage(
  sessionId: string,
  text: string,
  sender: 'user' | 'ai' = 'user'
): Promise<SessionMessageViewModel> {
  const command: CreateSessionMessageCommand = {
    sender,
    content: {
      type: 'text',
      text,
    },
  };

  const res = await fetch(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin', // Include cookies
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    await handleApiError(res);
  }

  const dto: SessionMessageDTO = await res.json();
  return mapSessionMessageDtoToVm(dto);
}

/**
 * End session with AI summary
 * PUT /api/sessions/{sessionId}/end
 * @throws ApiErrorUiModel on error
 */
export async function endSession(
  sessionId: string,
  aiSummary: string
): Promise<SessionViewModel> {
  const res = await fetch(`/api/sessions/${sessionId}/end`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin', // Include cookies
    body: JSON.stringify({ ai_summary: aiSummary }),
  });

  if (!res.ok) {
    await handleApiError(res);
  }

  const dto: SessionDetailsDTO = await res.json();
  return mapSessionDetailsDtoToVm(dto);
}
