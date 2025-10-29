import type { APIRoute } from 'astro';
import { z } from 'zod';
import { sessionsService } from '../../../lib/services/sessions.service';
import { createSuccessResponse, ErrorResponses } from '../../../lib/utils/api-response';

/**
 * Zod schema for validating UUID format
 *
 * Validates that the sessionId parameter is a valid UUID v4 string.
 */
const UuidSchema = z.string().uuid({
  message: 'sessionId must be a valid UUID'
});

// Required for all API routes in Astro
export const prerender = false;

/**
 * GET /api/sessions/{sessionId}
 *
 * Returns detailed information about a specific session.
 * Uses JWT Bearer token for authentication and Supabase RLS for authorization.
 *
 * SECURITY NOTE: This endpoint distinguishes between 403 (Forbidden - session exists but
 * belongs to another user) and 404 (Not Found - session doesn't exist) by using an admin
 * check with service role key. This prevents information leakage about session existence.
 *
 * @requires Authentication - JWT Bearer token in Authorization header
 * @requires Ownership - User must own the session (checked via RLS)
 *
 * @param {string} sessionId - UUID of the session (path parameter)
 *
 * @returns {SessionDetailsDTO} 200 - Session details with topic title
 * @returns {ApiErrorResponseDTO} 400 - Invalid sessionId format
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication token
 * @returns {ApiErrorResponseDTO} 403 - Session exists but belongs to another user
 * @returns {ApiErrorResponseDTO} 404 - Session not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/sessions/550e8400-e29b-41d4-a716-446655440000
 * Headers: { Authorization: "Bearer <jwt_token>" }
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
 *
 * // Error Response (400)
 * {
 *   "error": {
 *     "code": "INVALID_INPUT",
 *     "message": "sessionId must be a valid UUID"
 *   }
 * }
 *
 * // Error Response (403)
 * {
 *   "error": {
 *     "code": "FORBIDDEN",
 *     "message": "Nie masz dostępu do tej sesji"
 *   }
 * }
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate sessionId parameter format
    const sessionId = params.sessionId;

    if (!sessionId) {
      return ErrorResponses.badRequest('sessionId jest wymagany');
    }

    // Validate UUID format using Zod
    const validation = UuidSchema.safeParse(sessionId);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Nieprawidłowy format sessionId';
      return ErrorResponses.badRequest(errorMessage);
    }

    // 2. Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn('GET /api/sessions/{id}: No active session');
      return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    // 3. Get authenticated user
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn('GET /api/sessions/{id}: User validation failed', authError?.message);
      return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
    }

    // 4. Try to fetch session details with RLS (user's own sessions only)
    const sessionDetails = await sessionsService.getSessionDetails(
      locals.supabase,
      sessionId
    );

    // 5. If session not found via RLS, distinguish between 404 and 403
    if (!sessionDetails) {
      // Use admin check to see if session exists at all
      try {
        const ownershipCheck = await sessionsService.checkSessionOwnershipWithAdmin(sessionId);

        if (ownershipCheck === 'not_found') {
          // Session truly doesn't exist - return 404
          console.info('GET /api/sessions/{id}: Session not found', { sessionId });
          return ErrorResponses.notFound('Sesja nie została znaleziona');
        } else {
          // Session exists but belongs to another user - return 403
          console.warn('GET /api/sessions/{id}: Access denied', {
            sessionId,
            requestingUserId: user.id,
            sessionOwnerId: ownershipCheck.user_id
          });
          return ErrorResponses.forbidden('Nie masz dostępu do tej sesji');
        }
      } catch (adminError) {
        // If admin check fails (e.g., service role key not configured),
        // fall back to generic 404 to avoid exposing implementation details
        console.error('GET /api/sessions/{id}: Admin check failed', {
          sessionId,
          error: adminError instanceof Error ? adminError.message : 'Unknown error'
        });
        return ErrorResponses.notFound('Sesja nie została znaleziona');
      }
    }

    // 6. Return success response
    console.info('GET /api/sessions/{id}: Success', {
      sessionId: sessionDetails.id,
      userId: user.id
    });
    return createSuccessResponse(sessionDetails);

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes('JWT') ||
          error.message.includes('token') ||
          error.message.includes('authenticated')) {
        console.warn('GET /api/sessions/{id}: Authentication error', error.message);
        return ErrorResponses.unauthorized('Nieprawidłowy lub wygasły token uwierzytelniający');
      }

      // Check for database connection errors
      if (error.message.includes('Database') ||
          error.message.includes('connection') ||
          error.message.includes('timeout')) {
        console.error('GET /api/sessions/{id}: Database error', error.message);
        return ErrorResponses.internalError('Błąd połączenia z bazą danych. Spróbuj ponownie później.');
      }
    }

    // Log unexpected errors with full context
    console.error('GET /api/sessions/{id}: Unexpected error', {
      sessionId: params.sessionId,
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};
