// ============================================================================
// Session View Types
// ============================================================================
// View models and types specific to the session view frontend

import type {
  SessionDetailsDTO,
  SessionMessageDTO,
  TextMessageContent,
} from '@/types';

/**
 * Session view model
 * Mapped from SessionDetailsDTO with camelCase naming
 */
export interface SessionViewModel {
  id: string;
  topicId: string | null;
  topicTitle: string | null;
  startedAtIso: string;
  endedAtIso: string | null;
  aiSummary: string | null;
}

/**
 * Session message view model
 * Mapped from SessionMessageDTO with camelCase naming
 */
export interface SessionMessageViewModel {
  id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  createdAtIso: string;
  // For optimistic messages:
  isOptimistic?: boolean;
  clientId?: string;
}

/**
 * API error UI model
 * User-friendly error representation
 */
export interface ApiErrorUiModel {
  code: string;
  message: string;
}

/**
 * Session state type for useSession hook
 */
export interface SessionState {
  data?: SessionViewModel;
  loading: boolean;
  error?: ApiErrorUiModel;
}

/**
 * Session messages state type for useSessionMessages hook
 */
export interface SessionMessagesState {
  messages: SessionMessageViewModel[];
  loading: boolean;
  error?: ApiErrorUiModel;
  total: number;
  hasMore: boolean;
}

/**
 * Map SessionDetailsDTO to SessionViewModel
 * Converts snake_case to camelCase
 */
export function mapSessionDetailsDtoToVm(dto: SessionDetailsDTO): SessionViewModel {
  return {
    id: dto.id,
    topicId: dto.topic_id,
    topicTitle: dto.topic_title ?? null,
    startedAtIso: dto.started_at,
    endedAtIso: dto.ended_at,
    aiSummary: dto.ai_summary,
  };
}

/**
 * Map SessionMessageDTO to SessionMessageViewModel
 * Converts snake_case to camelCase and extracts text content
 */
export function mapSessionMessageDtoToVm(dto: SessionMessageDTO): SessionMessageViewModel {
  // Check if content is text type
  const isText = dto.content && (dto.content as any).type === 'text';
  const textContent = isText ? (dto.content as TextMessageContent) : null;

  return {
    id: dto.id,
    sessionId: dto.session_id,
    sender: dto.sender,
    text: textContent ? textContent.text : '',
    audioUrl: textContent?.audio_url,
    createdAtIso: dto.created_at,
  };
}
