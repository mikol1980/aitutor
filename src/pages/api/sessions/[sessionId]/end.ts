import type { APIRoute } from 'astro';
import { z } from 'zod';
import { sessionsService } from '../../../../lib/services/sessions.service';
import { createSuccessResponse, ErrorResponses } from '../../../../lib/utils/api-response';
import type { EndSessionCommand } from '../../../../types';

/**
 * Zod schema for validating UUID format
 */
const UuidSchema = z.string().uuid({
  message: 'sessionId must be a valid UUID'
});

/**
 * Zod schema for EndSessionCommand
 */
const EndSessionCommandSchema = z.object({
  ai_summary: z.string().min(1, 'AI summary cannot be empty'),
});

// Required for all API routes in Astro
export const prerender = false;

/**
 * PUT /api/sessions/{sessionId}/end
 *
 * Ends a session by setting ended_at timestamp and storing AI summary.
 *
 * @requires Authentication - JWT Bearer token in Authorization header
 * @requires Ownership - User must own the session (checked via RLS)
 *
 * @param {string} sessionId - UUID of the session (path parameter)
 * @param {EndSessionCommand} body - End session data with ai_summary
 *
 * @returns {SessionDetailsDTO} 200 - Updated session details
 * @returns {ApiErrorResponseDTO} 400 - Invalid input
 * @returns {ApiErrorResponseDTO} 401 - Unauthorized
 * @returns {ApiErrorResponseDTO} 404 - Session not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request
 * PUT /api/sessions/550e8400-e29b-41d4-a716-446655440000/end
 * Headers: { Authorization: "Bearer <jwt_token>" }
 * Body: { "ai_summary": "Student practiced quadratic equations..." }
 *
 * // Success Response (200)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "user_id": "user-uuid-here",
 *   "topic_id": "topic-uuid-here",
 *   "started_at": "2025-10-13T10:30:00Z",
 *   "ended_at": "2025-10-13T11:30:00Z",
 *   "ai_summary": "Student practiced quadratic equations...",
 *   "topic_title": "Równania kwadratowe"
 * }
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate sessionId parameter
    const sessionId = params.sessionId;

    if (!sessionId) {
      return ErrorResponses.badRequest('sessionId jest wymagany');
    }

    const validation = UuidSchema.safeParse(sessionId);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Nieprawidłowy format sessionId';
      return ErrorResponses.badRequest(errorMessage);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const commandValidation = EndSessionCommandSchema.safeParse(body);

    if (!commandValidation.success) {
      const errorMessage = commandValidation.error.errors[0]?.message || 'Nieprawidłowe dane zakończenia sesji';
      return ErrorResponses.badRequest(errorMessage);
    }

    const command: EndSessionCommand = commandValidation.data;

    // 3. Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn('PUT /api/sessions/{id}/end: No active session');
      return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    // 4. Get authenticated user
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn('PUT /api/sessions/{id}/end: User validation failed', authError?.message);
      return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
    }

    // 5. End session (RLS ensures user can only end their own sessions)
    const updatedSession = await sessionsService.endSession(
      locals.supabase,
      sessionId,
      command.ai_summary
    );

    // 6. Return success response
    console.info('PUT /api/sessions/{id}/end: Success', {
      sessionId: updatedSession.id,
      userId: user.id,
      endedAt: updatedSession.ended_at,
    });

    return createSuccessResponse(updatedSession);

  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      if (error.message.includes('JWT') ||
          error.message.includes('token') ||
          error.message.includes('authenticated')) {
        console.warn('PUT /api/sessions/{id}/end: Authentication error', error.message);
        return ErrorResponses.unauthorized('Nieprawidłowy lub wygasły token uwierzytelniający');
      }

      if (error.message.includes('not found') ||
          error.message.includes('access denied')) {
        console.warn('PUT /api/sessions/{id}/end: Session not found or forbidden', error.message);
        return ErrorResponses.notFound('Sesja nie została znaleziona lub nie masz do niej dostępu');
      }

      if (error.message.includes('Database') ||
          error.message.includes('connection')) {
        console.error('PUT /api/sessions/{id}/end: Database error', error.message);
        return ErrorResponses.internalError('Błąd połączenia z bazą danych. Spróbuj ponownie później.');
      }
    }

    console.error('PUT /api/sessions/{id}/end: Unexpected error', {
      sessionId: params.sessionId,
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return ErrorResponses.internalError();
  }
};
