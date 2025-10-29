// ============================================================================
// Login API Endpoint
// ============================================================================
// POST /api/auth/login
// Authenticates user with email and password

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { authService, AuthError } from '../../../lib/services/auth.service';
import { profileService } from '../../../lib/services/profile.service';
import { createSuccessResponse, ErrorResponses } from '../../../lib/utils/api-response';
import type { LoginRequest, LoginResponse } from '../../../types';

// Disable prerendering for this API route
export const prerender = false;

/**
 * Validation schema for login request
 */
const LoginRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Podaj prawidłowy adres email'),
  password: z
    .string()
    .min(6, 'Hasło musi mieć minimum 6 znaków'),
});

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * On success, sets authentication cookies and returns user data with session.
 *
 * @body {LoginRequest} - Email and password
 *
 * @returns {LoginResponse} 200 - User data and session tokens
 * @returns {ApiErrorResponseDTO} 400 - Invalid input data
 * @returns {ApiErrorResponseDTO} 401 - Invalid credentials
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request
 * POST /api/auth/login
 * Content-Type: application/json
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * // Success Response (200)
 * {
 *   "user": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "email": "user@example.com",
 *     "login": "user123"
 *   },
 *   "session": {
 *     "access_token": "eyJhbGc...",
 *     "refresh_token": "v1.abc...",
 *     "expires_at": 1697472000
 *   }
 * }
 *
 * // Error Response (401)
 * {
 *   "error": {
 *     "code": "INVALID_CREDENTIALS",
 *     "message": "Nieprawidłowy email lub hasło."
 *   }
 * }
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // 1. Parse and validate request body
    let body: LoginRequest;
    try {
      body = await request.json();
    } catch (error) {
      console.warn('POST /api/auth/login: Invalid JSON in request body');
      return ErrorResponses.badRequest('Nieprawidłowy format danych');
    }

    // 2. Validate input with Zod
    const validation = LoginRequestSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      console.warn('POST /api/auth/login: Validation failed', validation.error.errors);
      return ErrorResponses.badRequest(
        firstError.message,
        { field: firstError.path[0], errors: validation.error.errors }
      );
    }

    const { email, password } = validation.data;

    // 3. Authenticate with auth service
    let authResult;
    try {
      authResult = await authService.signIn(locals.supabase, email, password);
    } catch (error) {
      // Handle authentication errors with Polish messages
      if (error instanceof AuthError) {
        console.warn('POST /api/auth/login: Authentication failed', {
          email,
          code: error.code,
        });
        return ErrorResponses.unauthorized(error.message);
      }
      throw error; // Re-throw unexpected errors
    }

    // 4. Fetch user profile for complete user data
    // Create authenticated supabase client with the new session
    const { data: sessionData } = await locals.supabase.auth.setSession({
      access_token: authResult.session.access_token,
      refresh_token: authResult.session.refresh_token,
    });

    if (!sessionData.session) {
      console.error('POST /api/auth/login: Failed to set session');
      return ErrorResponses.internalError('Nie udało się utworzyć sesji');
    }

    // Fetch profile to get login username
    const profile = await profileService.getProfile(locals.supabase);

    if (!profile) {
      console.error('POST /api/auth/login: Profile not found after successful auth', {
        userId: authResult.user.id,
      });
      return ErrorResponses.internalError('Nie znaleziono profilu użytkownika');
    }

    // 5. Set authentication cookies
    // Supabase automatically manages cookies, but we can set additional options
    // The session is already stored by Supabase client
    cookies.set('sb-access-token', authResult.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookies.set('sb-refresh-token', authResult.session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // 6. Build and return success response
    const response: LoginResponse = {
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        login: profile.login,
      },
      session: {
        access_token: authResult.session.access_token,
        refresh_token: authResult.session.refresh_token,
        expires_at: sessionData.session.expires_at || 0,
      },
    };

    console.info('POST /api/auth/login: Success', {
      userId: authResult.user.id,
      email: authResult.user.email,
    });

    return createSuccessResponse(response, 200);
  } catch (error) {
    // Handle unexpected errors
    console.error('POST /api/auth/login: Unexpected error', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return ErrorResponses.internalError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
  }
};
