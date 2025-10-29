// ============================================================================
// Register API Endpoint
// ============================================================================
// POST /api/auth/register
// Creates new user account with auto-login

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { authService, AuthError } from '../../../lib/services/auth.service';
import { profileService } from '../../../lib/services/profile.service';
import { createSuccessResponse, ErrorResponses } from '../../../lib/utils/api-response';
import type { RegisterRequest, RegisterResponse } from '../../../types';

// Disable prerendering for this API route
export const prerender = false;

/**
 * Validation schema for register request
 */
const RegisterRequestSchema = z.object({
  login: z
    .string()
    .min(3, 'Login musi mieć minimum 3 znaki')
    .max(30, 'Login może mieć maksymalnie 30 znaków')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Login może zawierać tylko litery, cyfry, _ oraz -'),
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Podaj prawidłowy adres email'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[a-z]/, 'Hasło musi zawierać przynajmniej jedną małą literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
});

/**
 * POST /api/auth/register
 *
 * Creates a new user account with Supabase Auth and profile record.
 * On success, automatically signs in the user and returns session data.
 *
 * @body {RegisterRequest} - Login, email and password
 *
 * @returns {RegisterResponse} 200 - User data and session tokens
 * @returns {ApiErrorResponseDTO} 400 - Invalid input data
 * @returns {ApiErrorResponseDTO} 409 - User already exists
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request
 * POST /api/auth/register
 * Content-Type: application/json
 * {
 *   "login": "jan_kowalski",
 *   "email": "jan@example.com",
 *   "password": "Password123"
 * }
 *
 * // Success Response (200)
 * {
 *   "user": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "email": "jan@example.com",
 *     "login": "jan_kowalski"
 *   },
 *   "session": {
 *     "access_token": "eyJhbGc...",
 *     "refresh_token": "v1.abc...",
 *     "expires_at": 1697472000
 *   }
 * }
 *
 * // Error Response (409 - User exists)
 * {
 *   "error": {
 *     "code": "USER_EXISTS",
 *     "message": "Użytkownik z tym adresem email już istnieje."
 *   }
 * }
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // 1. Parse and validate request body
    let body: RegisterRequest;
    try {
      body = await request.json();
    } catch (error) {
      console.warn('POST /api/auth/register: Invalid JSON in request body');
      return ErrorResponses.badRequest('Nieprawidłowy format danych');
    }

    // 2. Validate input with Zod
    const validation = RegisterRequestSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      console.warn('POST /api/auth/register: Validation failed', validation.error.errors);
      return ErrorResponses.badRequest(
        firstError.message,
        { field: firstError.path[0], errors: validation.error.errors }
      );
    }

    const { login, email, password } = validation.data;

    // 3. Check if login is already taken
    const { data: existingProfile } = await locals.supabase
      .from('profiles')
      .select('login')
      .eq('login', login)
      .single();

    if (existingProfile) {
      console.warn('POST /api/auth/register: Login already exists', { login });
      return createSuccessResponse(
        {
          error: {
            code: 'LOGIN_EXISTS',
            message: 'Ten login jest już zajęty. Wybierz inny.',
          },
        },
        409
      );
    }

    // 4. Register user with auth service
    let authResult;
    try {
      authResult = await authService.signUp(locals.supabase, login, email, password);
    } catch (error) {
      // Handle registration errors with Polish messages
      if (error instanceof AuthError) {
        console.warn('POST /api/auth/register: Registration failed', {
          email,
          login,
          code: error.code,
        });

        // Check if it's a duplicate user error
        if (error.message.includes('już istnieje')) {
          return createSuccessResponse(
            {
              error: {
                code: 'USER_EXISTS',
                message: error.message,
              },
            },
            409
          );
        }

        return ErrorResponses.badRequest(error.message);
      }
      throw error; // Re-throw unexpected errors
    }

    // 5. Set session in Supabase client
    const { data: sessionData } = await locals.supabase.auth.setSession({
      access_token: authResult.session.access_token,
      refresh_token: authResult.session.refresh_token,
    });

    if (!sessionData.session) {
      console.error('POST /api/auth/register: Failed to set session');
      return ErrorResponses.internalError('Nie udało się utworzyć sesji');
    }

    // 6. Fetch profile to get complete user data
    const profile = await profileService.getProfile(locals.supabase);

    if (!profile) {
      console.error('POST /api/auth/register: Profile not found after successful registration', {
        userId: authResult.user.id,
      });
      return ErrorResponses.internalError('Nie znaleziono profilu użytkownika');
    }

    // 7. Set authentication cookies
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

    // 8. Build and return success response
    const response: RegisterResponse = {
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

    console.info('POST /api/auth/register: Success', {
      userId: authResult.user.id,
      email: authResult.user.email,
      login: profile.login,
    });

    return createSuccessResponse(response, 200);
  } catch (error) {
    // Handle unexpected errors
    console.error('POST /api/auth/register: Unexpected error', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return ErrorResponses.internalError('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
  }
};
