import type { APIRoute } from 'astro';
import { profileService } from '../../lib/services/profile.service';
import { createSuccessResponse, ErrorResponses } from '../../lib/utils/api-response';

/**
 * GET /api/profile
 * 
 * Returns the authenticated user's profile information.
 * Uses JWT Bearer token for authentication and Supabase RLS for authorization.
 * 
 * @requires Authentication - JWT Bearer token in Authorization header
 * 
 * @returns {ProfileDTO} 200 - User profile data
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication token
 * @returns {ApiErrorResponseDTO} 404 - Profile not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 * 
 * @example
 * // Request
 * GET /api/profile
 * Headers: { Authorization: "Bearer <jwt_token>" }
 * 
 * // Success Response (200)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "login": "student123",
 *   "email": "student@example.com",
 *   "has_completed_tutorial": false,
 *   "created_at": "2025-10-13T10:30:00Z"
 * }
 * 
 * // Error Response (401)
 * {
 *   "error": {
 *     "code": "UNAUTHORIZED",
 *     "message": "Missing authentication token"
 *   }
 * }
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Get session from middleware (already restored from cookies)
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn('GET /api/profile: No active session');
      return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    // 2. Get authenticated user
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn('GET /api/profile: User validation failed', authError?.message);
      return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
    }

    // 3. Fetch profile using service
    // The service will use RLS to ensure user can only access their own profile
    const profile = await profileService.getProfile(locals.supabase);

    // 5. Handle not found case
    if (!profile) {
      // This should not happen in normal flow - indicates data integrity issue
      console.error('GET /api/profile: Profile not found for authenticated user', {
        userId: user.id
      });
      return ErrorResponses.notFound('Profile not found');
    }

    // 6. Return success response
    console.info('GET /api/profile: Success', { userId: profile.id });
    return createSuccessResponse(profile);

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes('JWT') || 
          error.message.includes('token') ||
          error.message.includes('authenticated')) {
        console.warn('GET /api/profile: Authentication error', error.message);
        return ErrorResponses.unauthorized('Invalid or expired authentication token');
      }

      // Check for database connection errors
      if (error.message.includes('Database') || 
          error.message.includes('connection') ||
          error.message.includes('timeout')) {
        console.error('GET /api/profile: Database error', error.message);
        return ErrorResponses.internalError('Database connection error. Please try again later.');
      }
    }

    // Log unexpected errors with full context
    console.error('GET /api/profile: Unexpected error', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};

