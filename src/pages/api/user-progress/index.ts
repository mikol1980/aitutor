import type { APIRoute } from 'astro';
import { z } from 'zod';
import { progressService } from '../../../lib/services/progress.service';
import { createSuccessResponse, ErrorResponses } from '../../../lib/utils/api-response';
import type { UserProgressStatus } from '../../../types';

// Disable pre-rendering for this API route (required for all API endpoints)
export const prerender = false;

/**
 * Query parameters validation schema
 * Validates optional section_id (UUID) and status (enum) parameters
 */
const QuerySchema = z.object({
  section_id: z.string().uuid({ message: 'section_id musi być poprawnym UUID' }).optional(),
  status: z
    .enum(['not_started', 'in_progress', 'completed'], {
      errorMap: () => ({ message: 'status musi być jednym z: not_started, in_progress, completed' })
    })
    .optional(),
});

/**
 * GET /api/user-progress
 *
 * Returns user progress overview with optional filtering by section and status.
 * Returns both detailed progress list and aggregated summary statistics.
 *
 * @requires Authentication - JWT session in cookies (managed by middleware)
 *
 * @query {string} [section_id] - Optional UUID to filter by section
 * @query {string} [status] - Optional status filter: not_started | in_progress | completed
 *
 * @returns {UserProgressOverviewResponseDTO} 200 - Progress data with summary
 * @returns {ApiErrorResponseDTO} 400 - Invalid query parameters
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request: Get all progress
 * GET /api/user-progress
 *
 * // Request: Filter by section
 * GET /api/user-progress?section_id=550e8400-e29b-41d4-a716-446655440000
 *
 * // Request: Filter by status
 * GET /api/user-progress?status=completed
 *
 * // Success Response (200)
 * {
 *   "progress": [
 *     {
 *       "user_id": "uuid",
 *       "section_id": "uuid",
 *       "section_title": "Algebra",
 *       "topic_id": "uuid",
 *       "topic_title": "Równania liniowe",
 *       "status": "completed",
 *       "score": 0.85,
 *       "updated_at": "2025-10-13T12:45:00Z"
 *     }
 *   ],
 *   "summary": {
 *     "total_topics": 45,
 *     "completed": 12,
 *     "in_progress": 3,
 *     "not_started": 30
 *   }
 * }
 *
 * // Error Response (400)
 * {
 *   "error": {
 *     "code": "INVALID_INPUT",
 *     "message": "section_id musi być poprawnym UUID"
 *   }
 * }
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // 1. Parse and validate query parameters
    const params = {
      section_id: url.searchParams.get('section_id') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    };

    const validationResult = QuerySchema.safeParse(params);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      console.warn('GET /api/user-progress: Validation failed', {
        field: firstError?.path.join('.'),
        message: firstError?.message
      });
      return ErrorResponses.badRequest(
        firstError?.message || 'Nieprawidłowe parametry zapytania'
      );
    }

    const { section_id, status } = validationResult.data;

    // 2. Check user session
    // Middleware has already restored session from cookies into locals.supabase
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn('GET /api/user-progress: No active session');
      return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    // 3. Verify authenticated user
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn('GET /api/user-progress: User validation failed', authError?.message);
      return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
    }

    // 4. Fetch progress data using service
    // RLS policies ensure user can only access their own progress
    const { progress, summary } = await progressService.getUserProgressOverview(
      locals.supabase,
      {
        sectionId: section_id,
        status: status as UserProgressStatus | undefined,
      }
    );

    // 5. Return success response
    console.info('GET /api/user-progress: Success', {
      userId: user.id,
      totalRecords: progress.length,
      filters: { section_id, status }
    });

    return createSuccessResponse({ progress, summary }, 200);

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes('authenticated') ||
          error.message.includes('JWT') ||
          error.message.includes('token')) {
        console.warn('GET /api/user-progress: Authentication error', error.message);
        return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
      }

      // Check for database errors
      if (error.message.includes('Database') ||
          error.message.includes('connection') ||
          error.message.includes('timeout')) {
        console.error('GET /api/user-progress: Database error', error.message);
        return ErrorResponses.internalError('Błąd połączenia z bazą danych. Spróbuj ponownie później.');
      }
    }

    // Log unexpected errors with full context
    console.error('GET /api/user-progress: Unexpected error', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};
