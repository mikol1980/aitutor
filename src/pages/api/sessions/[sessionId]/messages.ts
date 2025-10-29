import type { APIRoute } from 'astro';
import { z } from 'zod';
import { sessionsService } from '../../../../lib/services/sessions.service';
import { createSuccessResponse, ErrorResponses } from '../../../../lib/utils/api-response';
import type { CreateSessionMessageCommand } from '../../../../types';

/**
 * Zod schema for validating UUID format
 */
const UuidSchema = z.string().uuid({
  message: 'sessionId must be a valid UUID'
});

/**
 * Zod schema for pagination query parameters
 */
const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Zod schema for CreateSessionMessageCommand
 */
const CreateSessionMessageCommandSchema = z.object({
  sender: z.enum(['user', 'ai']),
  content: z.object({
    type: z.literal('text'),
    text: z.string().min(1, 'Text content cannot be empty'),
    audio_url: z.string().url().optional(),
  }),
});

// Required for all API routes in Astro
export const prerender = false;

/**
 * GET /api/sessions/{sessionId}/messages
 *
 * Returns paginated list of messages for a specific session.
 *
 * @requires Authentication - JWT Bearer token in Authorization header
 * @requires Ownership - User must own the session (checked via RLS)
 *
 * @param {string} sessionId - UUID of the session (path parameter)
 * @param {number} limit - Maximum messages to return (query param, default: 50, max: 100)
 * @param {number} offset - Number of messages to skip (query param, default: 0)
 * @param {string} order - Sort order 'asc' or 'desc' (query param, default: 'asc')
 *
 * @returns {SessionMessageListResponseDTO} 200 - Paginated messages
 * @returns {ApiErrorResponseDTO} 400 - Invalid parameters
 * @returns {ApiErrorResponseDTO} 401 - Unauthorized
 * @returns {ApiErrorResponseDTO} 404 - Session not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
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

    // 2. Parse and validate query parameters
    const queryParams = {
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      order: url.searchParams.get('order'),
    };

    const queryValidation = PaginationQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      const errorMessage = queryValidation.error.errors[0]?.message || 'Nieprawidłowe parametry zapytania';
      return ErrorResponses.badRequest(errorMessage);
    }

    const { limit, offset, order } = queryValidation.data;

    // 3. Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn('GET /api/sessions/{id}/messages: No active session');
      return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    // 4. Get authenticated user
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn('GET /api/sessions/{id}/messages: User validation failed', authError?.message);
      return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
    }

    // 5. Fetch messages (RLS ensures user can only access their own sessions)
    const result = await sessionsService.getSessionMessages(
      locals.supabase,
      sessionId,
      limit,
      offset,
      order
    );

    // 6. Return success response
    console.info('GET /api/sessions/{id}/messages: Success', {
      sessionId,
      userId: user.id,
      messageCount: result.messages.length,
      total: result.pagination.total,
    });

    return createSuccessResponse({
      messages: result.messages,
      pagination: result.pagination,
    });

  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      if (error.message.includes('JWT') ||
          error.message.includes('token') ||
          error.message.includes('authenticated')) {
        console.warn('GET /api/sessions/{id}/messages: Authentication error', error.message);
        return ErrorResponses.unauthorized('Nieprawidłowy lub wygasły token uwierzytelniający');
      }

      if (error.message.includes('Database') ||
          error.message.includes('connection')) {
        console.error('GET /api/sessions/{id}/messages: Database error', error.message);
        return ErrorResponses.internalError('Błąd połączenia z bazą danych. Spróbuj ponownie później.');
      }
    }

    console.error('GET /api/sessions/{id}/messages: Unexpected error', {
      sessionId: params.sessionId,
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return ErrorResponses.internalError();
  }
};

/**
 * POST /api/sessions/{sessionId}/messages
 *
 * Creates a new message in the session.
 *
 * @requires Authentication - JWT Bearer token in Authorization header
 * @requires Ownership - User must own the session (checked via RLS)
 *
 * @param {string} sessionId - UUID of the session (path parameter)
 * @param {CreateSessionMessageCommand} body - Message data
 *
 * @returns {SessionMessageDTO} 201 - Created message
 * @returns {ApiErrorResponseDTO} 400 - Invalid input
 * @returns {ApiErrorResponseDTO} 401 - Unauthorized
 * @returns {ApiErrorResponseDTO} 404 - Session not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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
    const commandValidation = CreateSessionMessageCommandSchema.safeParse(body);

    if (!commandValidation.success) {
      const errorMessage = commandValidation.error.errors[0]?.message || 'Nieprawidłowe dane wiadomości';
      return ErrorResponses.badRequest(errorMessage);
    }

    const command: CreateSessionMessageCommand = commandValidation.data;

    // 3. Check authentication
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn('POST /api/sessions/{id}/messages: No active session');
      return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');
    }

    // 4. Get authenticated user
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn('POST /api/sessions/{id}/messages: User validation failed', authError?.message);
      return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
    }

    // 5. Create message (RLS ensures user can only add to their own sessions)
    const message = await sessionsService.createSessionMessage(
      locals.supabase,
      sessionId,
      command
    );

    // 6. Return success response
    console.info('POST /api/sessions/{id}/messages: Success', {
      sessionId,
      userId: user.id,
      messageId: message.id,
      sender: message.sender,
    });

    return createSuccessResponse(message, 201);

  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      if (error.message.includes('JWT') ||
          error.message.includes('token') ||
          error.message.includes('authenticated')) {
        console.warn('POST /api/sessions/{id}/messages: Authentication error', error.message);
        return ErrorResponses.unauthorized('Nieprawidłowy lub wygasły token uwierzytelniający');
      }

      if (error.message.includes('not found') ||
          error.message.includes('access denied')) {
        console.warn('POST /api/sessions/{id}/messages: Session not found or forbidden', error.message);
        return ErrorResponses.notFound('Sesja nie została znaleziona lub nie masz do niej dostępu');
      }

      if (error.message.includes('Database') ||
          error.message.includes('connection')) {
        console.error('POST /api/sessions/{id}/messages: Database error', error.message);
        return ErrorResponses.internalError('Błąd połączenia z bazą danych. Spróbuj ponownie później.');
      }
    }

    console.error('POST /api/sessions/{id}/messages: Unexpected error', {
      sessionId: params.sessionId,
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return ErrorResponses.internalError();
  }
};
