// ============================================================================
// AI TUTOR - DTO and Command Model Types
// ============================================================================
// This file contains all Data Transfer Object (DTO) and Command Model types
// used by the REST API. Each type is derived from database entity definitions
// and aligned with the API specification.
// ============================================================================

import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Base Types
// ============================================================================
// These types represent the core database entities. We'll derive DTOs from them.

// Note: Until database.types.ts is generated from Supabase, we define entities manually
// based on the db_schema.sql file.

/**
 * Profile entity - represents user profile data
 * Source: profiles table
 */
export interface ProfileEntity {
  id: string; // UUID
  login: string;
  email: string;
  has_completed_tutorial: boolean;
  created_at: string; // ISO timestamp
}

/**
 * Section entity - represents broad subject areas
 * Source: sections table
 */
export interface SectionEntity {
  id: string; // UUID
  title: string;
  description: string | null;
  display_order: number;
  created_at: string; // ISO timestamp
}

/**
 * Topic entity - represents specific concepts within sections
 * Source: topics table
 */
export interface TopicEntity {
  id: string; // UUID
  section_id: string; // UUID
  title: string;
  description: string | null;
  display_order: number;
  created_at: string; // ISO timestamp
}

/**
 * Content usage types - enum from database
 * Source: content_usage_type ENUM
 */
export type ContentUsageType = "explanation" | "exercise" | "diagnostic_question";

/**
 * Learning content entity - educational materials
 * Source: learning_content table
 */
export interface LearningContentEntity {
  id: string; // UUID
  topic_id: string | null; // UUID
  usage_type: ContentUsageType;
  content: Record<string, any>; // JSONB - flexible structure
  is_verified: boolean;
  created_at: string; // ISO timestamp
}

/**
 * Diagnostic test entity
 * Source: diagnostic_tests table
 */
export interface DiagnosticTestEntity {
  id: string; // UUID
  section_id: string; // UUID
  title: string;
  created_at: string; // ISO timestamp
}

/**
 * User progress status - enum from database
 * Source: user_progress_status ENUM
 */
export type UserProgressStatus = "not_started" | "in_progress" | "completed";

/**
 * Diagnostic test attempt entity
 * Source: diagnostic_test_attempts table
 */
export interface DiagnosticTestAttemptEntity {
  id: string; // UUID
  user_id: string; // UUID
  diagnostic_test_id: string; // UUID
  score: number; // 0.0 to 1.0
  completed_at: string; // ISO timestamp
}

/**
 * User answer entity
 * Source: user_answers table
 */
export interface UserAnswerEntity {
  id: string; // UUID
  attempt_id: string; // UUID
  content_id: string; // UUID
  answer_content: Record<string, any>; // JSONB
  is_correct: boolean;
}

/**
 * Message sender - enum from database
 * Source: message_sender ENUM
 */
export type MessageSender = "user" | "ai";

/**
 * Session entity
 * Source: sessions table
 */
export interface SessionEntity {
  id: string; // UUID
  user_id: string; // UUID
  topic_id: string | null; // UUID
  started_at: string; // ISO timestamp
  ended_at: string | null; // ISO timestamp
  ai_summary: string | null;
}

/**
 * Session message entity
 * Source: session_messages table
 */
export interface SessionMessageEntity {
  id: string; // UUID
  session_id: string; // UUID
  sender: MessageSender;
  content: Record<string, any>; // JSONB
  created_at: string; // ISO timestamp
}

/**
 * User progress entity
 * Source: user_progress table
 */
export interface UserProgressEntity {
  user_id: string; // UUID
  topic_id: string; // UUID
  status: UserProgressStatus;
  score: number | null; // 0.0 to 1.0
  updated_at: string; // ISO timestamp
}

// ============================================================================
// 1. AUTHENTICATION & PROFILE DTOs
// ============================================================================

/**
 * Login Request - request body for POST /api/auth/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login Response - returned by POST /api/auth/login
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    login: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Register Request - request body for POST /api/auth/register
 */
export interface RegisterRequest {
  login: string;
  email: string;
  password: string;
}

/**
 * Register Response - returned by POST /api/auth/register
 * Same structure as LoginResponse (auto-login after registration)
 */
export type RegisterResponse = LoginResponse;

/**
 * Profile DTO - returned by GET /api/profile
 * Derived from: ProfileEntity
 */
export type ProfileDTO = ProfileEntity;

/**
 * Update Profile Command - request body for PUT /api/profile
 * Allows updating tutorial completion status
 */
export interface UpdateProfileCommand {
  has_completed_tutorial: boolean;
}

// ============================================================================
// 2. KNOWLEDGE STRUCTURE DTOs
// ============================================================================

/**
 * Section DTO - returned by GET /api/sections/{id}
 * Derived from: SectionEntity
 */
export type SectionDTO = SectionEntity;

/**
 * Section List Response - returned by GET /api/sections
 */
export interface SectionListResponseDTO {
  sections: SectionDTO[];
}

/**
 * Topic DTO - returned by GET /api/topics/{id}
 * Derived from: TopicEntity
 */
export type TopicDTO = TopicEntity;

/**
 * Topic List Response - returned by GET /api/sections/{sectionId}/topics
 */
export interface TopicListResponseDTO {
  topics: TopicDTO[];
}

/**
 * Topic Dependency Info - represents a prerequisite topic
 * Combines TopicEntity with section information
 */
export interface TopicDependencyDTO {
  id: string; // UUID - topic ID
  title: string;
  description: string | null;
  section_id: string; // UUID
  section_title: string;
}

/**
 * Topic Dependencies Response - returned by GET /api/topics/{id}/dependencies
 */
export interface TopicDependenciesResponseDTO {
  topic_id: string; // UUID
  dependencies: TopicDependencyDTO[];
}

// ============================================================================
// 3. LEARNING CONTENT DTOs
// ============================================================================

/**
 * Learning Content DTO - returned by GET /api/topics/{id}/content
 * Derived from: LearningContentEntity
 */
export type LearningContentDTO = LearningContentEntity;

/**
 * Learning Content List Response
 */
export interface LearningContentListResponseDTO {
  content: LearningContentDTO[];
}

// Content structure interfaces for type safety
// These define the structure of the JSONB content field based on usage_type

/**
 * Explanation content structure
 */
export interface ExplanationContent {
  text: string;
  examples?: string[];
  images?: string[];
}

/**
 * Exercise content structure
 */
export interface ExerciseContent {
  question: string;
  correct_answer: string;
  explanation: string;
  hints?: string[];
}

/**
 * Diagnostic question content structure
 */
export interface DiagnosticQuestionContent {
  question: string;
  type?: "multiple_choice" | "short_answer";
  options?: string[]; // For multiple choice
  correct_answer: string | number; // Index for multiple choice, value for short answer
  correct_answer_index?: number; // Alternative field for multiple choice
}

// ============================================================================
// 4. DIAGNOSTIC TEST DTOs
// ============================================================================

/**
 * Diagnostic Test Question DTO
 * Represents a single question in a diagnostic test
 */
export interface DiagnosticTestQuestionDTO {
  id: string; // UUID - content_id
  content: DiagnosticQuestionContent;
}

/**
 * Diagnostic Test DTO - returned by GET /api/sections/{id}/diagnostic-test
 * Combines DiagnosticTestEntity with questions
 */
export interface DiagnosticTestDTO {
  id: string; // UUID
  section_id: string; // UUID
  title: string;
  created_at: string; // ISO timestamp
  questions: DiagnosticTestQuestionDTO[];
}

// ============================================================================
// 5. DIAGNOSTIC TEST ATTEMPT DTOs
// ============================================================================

/**
 * Create Diagnostic Test Attempt Command
 * Request body for POST /api/diagnostic-test-attempts
 */
export interface CreateDiagnosticTestAttemptCommand {
  diagnostic_test_id: string; // UUID
}

/**
 * Diagnostic Test Attempt DTO
 * Derived from: DiagnosticTestAttemptEntity
 * Returned by POST /api/diagnostic-test-attempts
 */
export type DiagnosticTestAttemptDTO = DiagnosticTestAttemptEntity;

/**
 * Answer result - part of complete attempt response
 */
export interface AnswerResultDTO {
  content_id: string; // UUID
  is_correct: boolean;
}

/**
 * Complete Diagnostic Test Attempt Response
 * Returned by PUT /api/diagnostic-test-attempts/{id}/complete
 * Extends DiagnosticTestAttemptDTO with answer details
 */
export interface CompleteDiagnosticTestAttemptResponseDTO extends DiagnosticTestAttemptDTO {
  answers: AnswerResultDTO[];
}

// ============================================================================
// 6. USER ANSWER DTOs
// ============================================================================

/**
 * Answer content structure for multiple choice questions
 */
export interface MultipleChoiceAnswerContent {
  selected_option_index: number;
}

/**
 * Answer content structure for short answer questions
 */
export interface ShortAnswerContent {
  answer: string;
}

/**
 * Generic answer content type
 */
export type AnswerContent = MultipleChoiceAnswerContent | ShortAnswerContent;

/**
 * Create User Answer Command
 * Request body for POST /api/user-answers
 */
export interface CreateUserAnswerCommand {
  attempt_id: string; // UUID
  content_id: string; // UUID
  answer_content: AnswerContent;
}

/**
 * User Answer DTO
 * Derived from: UserAnswerEntity
 * Returned by POST /api/user-answers
 */
export type UserAnswerDTO = UserAnswerEntity;

// ============================================================================
// 7. LEARNING SESSION DTOs
// ============================================================================

/**
 * Create Session Command
 * Request body for POST /api/sessions
 */
export interface CreateSessionCommand {
  topic_id: string; // UUID
}

/**
 * Session DTO - returned by POST /api/sessions
 * Derived from: SessionEntity
 */
export type SessionDTO = SessionEntity;

/**
 * Session Details DTO - returned by GET /api/sessions/{id}
 * Extends SessionEntity with topic information
 */
export interface SessionDetailsDTO extends SessionEntity {
  topic_title: string | null;
}

/**
 * End Session Command
 * Request body for PUT /api/sessions/{id}/end
 */
export interface EndSessionCommand {
  ai_summary: string;
}

/**
 * Session List Item - item in session list response
 * Includes topic title for convenience
 */
export interface SessionListItemDTO {
  id: string; // UUID
  user_id: string; // UUID
  topic_id: string | null; // UUID
  topic_title: string | null;
  started_at: string; // ISO timestamp
  ended_at: string | null; // ISO timestamp
  ai_summary: string | null;
}

/**
 * Pagination metadata
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more?: boolean;
}

/**
 * Session List Response - returned by GET /api/sessions
 */
export interface SessionListResponseDTO {
  sessions: SessionListItemDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// 8. SESSION MESSAGE DTOs
// ============================================================================

/**
 * Message content structure for text messages
 */
export interface TextMessageContent {
  type: "text";
  text: string;
  audio_url?: string; // Optional audio URL for AI responses
}

/**
 * Generic message content type (extensible for future types)
 */
export type MessageContent = TextMessageContent;

/**
 * Create Session Message Command
 * Request body for POST /api/sessions/{id}/messages
 */
export interface CreateSessionMessageCommand {
  sender: MessageSender;
  content: MessageContent;
}

/**
 * Session Message DTO
 * Derived from: SessionMessageEntity
 * Returned by POST /api/sessions/{id}/messages and GET /api/sessions/{id}/messages
 */
export type SessionMessageDTO = SessionMessageEntity;

/**
 * Session Message List Response
 * Returned by GET /api/sessions/{id}/messages
 */
export interface SessionMessageListResponseDTO {
  messages: SessionMessageDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// 9. USER PROGRESS DTOs
// ============================================================================

/**
 * User Progress DTO - base progress information
 * Derived from: UserProgressEntity
 */
export type UserProgressDTO = UserProgressEntity;

/**
 * Update User Progress Command
 * Request body for PUT /api/user-progress/{topicId}
 */
export interface UpdateUserProgressCommand {
  status: UserProgressStatus;
  score?: number; // 0.0 to 1.0
}

/**
 * User Progress with Topic Details
 * Extends UserProgressDTO with section and topic information
 */
export interface UserProgressWithDetailsDTO {
  user_id: string; // UUID
  section_id: string; // UUID
  section_title: string;
  topic_id: string; // UUID
  topic_title: string;
  status: UserProgressStatus;
  score: number | null;
  updated_at: string | null; // ISO timestamp
}

/**
 * User Progress Summary
 * Aggregated statistics for progress overview
 */
export interface UserProgressSummaryDTO {
  total_topics: number;
  completed: number;
  in_progress: number;
  not_started: number;
}

/**
 * User Progress Overview Response
 * Returned by GET /api/user-progress
 */
export interface UserProgressOverviewResponseDTO {
  progress: UserProgressWithDetailsDTO[];
  summary: UserProgressSummaryDTO;
}

/**
 * Topic Progress Summary
 * Progress information for a single topic within a section
 */
export interface TopicProgressSummaryDTO {
  topic_id: string; // UUID
  topic_title: string;
  status: UserProgressStatus;
  score: number | null;
}

/**
 * Section Progress Summary
 * Aggregated progress for all topics in a section
 */
export interface SectionProgressSummaryDTO {
  total_topics: number;
  completed: number;
  in_progress: number;
  not_started: number;
  average_score: number | null;
}

/**
 * Section Progress Response
 * Returned by GET /api/sections/{id}/progress
 */
export interface SectionProgressResponseDTO {
  section_id: string; // UUID
  section_title: string;
  topics: TopicProgressSummaryDTO[];
  summary: SectionProgressSummaryDTO;
}

/**
 * Get Topic Progress Response
 * Returned by GET /api/user-progress/{topicId}
 * Extends UserProgressDTO with topic title
 */
export interface TopicProgressResponseDTO extends UserProgressDTO {
  topic_title: string;
}

// ============================================================================
// 10. ERROR HANDLING DTOs
// ============================================================================

/**
 * Error detail - provides specific information about validation errors
 */
export interface ErrorDetailDTO {
  field?: string;
  constraint?: string;
  message?: string;
}

/**
 * API Error Response
 * Standard error response format for all API endpoints
 */
export interface ApiErrorResponseDTO {
  error: {
    code: string; // Error code (e.g., 'UNAUTHORIZED', 'NOT_FOUND')
    message: string; // Human-readable error message
    details?: ErrorDetailDTO | Record<string, any>; // Optional additional details
  };
}

// ============================================================================
// 11. UTILITY TYPES
// ============================================================================

/**
 * Omit created_at and id for creation commands
 */
export type CreateEntityCommand<T> = Omit<T, "id" | "created_at">;

/**
 * Partial update command - makes all fields optional except id
 */
export type UpdateEntityCommand<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;

/**
 * Generic list response wrapper
 */
export interface ListResponseDTO<T> {
  items: T[];
  pagination?: PaginationDTO;
}

// ============================================================================
// 12. TYPE GUARDS
// ============================================================================
// Type guards help with runtime type checking of union types

/**
 * Type guard for multiple choice answer content
 */
export function isMultipleChoiceAnswer(content: AnswerContent): content is MultipleChoiceAnswerContent {
  return "selected_option_index" in content;
}

/**
 * Type guard for short answer content
 */
export function isShortAnswer(content: AnswerContent): content is ShortAnswerContent {
  return "answer" in content;
}

/**
 * Type guard for text message content
 */
export function isTextMessageContent(content: MessageContent): content is TextMessageContent {
  return content.type === "text";
}

// ============================================================================
// 13. ONBOARDING VIEW TYPES
// ============================================================================

/**
 * Onboarding step index (0-based)
 */
export type OnboardingStep = 0 | 1 | 2 | 3;

/**
 * Onboarding state view model
 */
export interface OnboardingStateVM {
  currentStep: OnboardingStep;
  totalSteps: 4;
  canSkip: boolean; // currentStep >= 2
  isSavingProfile: boolean;
  hasConsentToFinish: boolean; // checkbox/dialog
}

/**
 * Step descriptor for onboarding flow
 */
export interface StepDescriptorVM {
  id: OnboardingStep;
  title: string;
  description?: string;
  ariaLabel?: string;
}

/**
 * API status type
 */
export type ApiStatus = "idle" | "loading" | "success" | "error";

/**
 * Generic API state view model
 */
export interface ApiStateVM<T = unknown> {
  status: ApiStatus;
  data?: T;
  error?: { code?: string; message: string };
}

/**
 * Message item for conversation demo
 */
export interface MessageItemVM {
  sender: "user" | "ai";
  text: string;
}

/**
 * Formula preview for demo
 */
export interface FormulaPreviewVM {
  raw: string;
  rendered?: string; // KaTeX/MathJax in future
}

/**
 * Progress legend item
 */
export interface ProgressLegendItemVM {
  label: string; // e.g., "Ukończone"
  colorClass: string; // Tailwind token
  ariaLabel: string;
}

/**
 * Storage key constant for onboarding
 */
export const ONBOARDING_STORAGE_KEY = "onboarding.step";
