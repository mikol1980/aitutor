// ============================================================================
// Authentication Service
// ============================================================================
// Handles all authentication operations with Supabase Auth
// Provides Polish error messages for better UX

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

/**
 * Authentication result with user data and session
 */
export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Authentication error with Polish message
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authentication Service
 *
 * Handles user authentication operations with Supabase Auth.
 * Provides Polish error messages and structured error handling.
 */
export class AuthService {
  /**
   * Sign in user with email and password
   *
   * This method authenticates a user with their email and password.
   * Supabase Auth automatically handles both email and login (if configured).
   *
   * @param supabase - Supabase client instance
   * @param email - User email or login
   * @param password - User password
   * @returns AuthResult with user data and session tokens
   * @throws AuthError with Polish error message
   *
   * @example
   * try {
   *   const result = await authService.signIn(supabase, 'user@example.com', 'password123');
   *   console.log('Logged in:', result.user.email);
   * } catch (error) {
   *   if (error instanceof AuthError) {
   *     console.error('Auth error:', error.message);
   *   }
   * }
   */
  async signIn(
    supabase: SupabaseClient<Database>,
    email: string,
    password: string
  ): Promise<AuthResult> {
    try {
      // Attempt to sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Handle authentication errors
      if (error) {
        throw new AuthError(
          this.translateAuthError(error.message),
          error.status?.toString() || 'AUTH_ERROR',
          error
        );
      }

      // Validate that we have both user and session
      if (!data.user || !data.session) {
        throw new AuthError(
          'Nie udało się zalogować. Spróbuj ponownie.',
          'INVALID_RESPONSE'
        );
      }

      // Return structured auth result
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      };
    } catch (error) {
      // Re-throw AuthError instances
      if (error instanceof AuthError) {
        throw error;
      }

      // Wrap unexpected errors
      console.error('Unexpected error during sign in:', error);
      throw new AuthError(
        'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Sign up new user with email, password and login
   *
   * This method creates a new user account with Supabase Auth and creates
   * a corresponding profile record. After successful registration, the user
   * is automatically signed in.
   *
   * @param supabase - Supabase client instance
   * @param login - Username for the profile
   * @param email - User email address
   * @param password - User password
   * @returns AuthResult with user data and session tokens
   * @throws AuthError with Polish error message
   */
  async signUp(
    supabase: SupabaseClient<Database>,
    login: string,
    email: string,
    password: string
  ): Promise<AuthResult> {
    try {
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            login, // Store login in user metadata
          },
        },
      });

      // Handle registration errors
      if (error) {
        throw new AuthError(
          this.translateSignUpError(error.message),
          error.status?.toString() || 'SIGNUP_ERROR',
          error
        );
      }

      // Validate that we have both user and session
      if (!data.user || !data.session) {
        throw new AuthError(
          'Nie udało się utworzyć konta. Spróbuj ponownie.',
          'INVALID_RESPONSE'
        );
      }

      // Create profile record
      // Note: This is typically handled by a database trigger (handle_new_user)
      // but we create it explicitly to ensure it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          login,
          email,
          has_completed_tutorial: false,
        });

      // Ignore error if profile already exists (trigger might have created it)
      if (profileError && !profileError.message.includes('duplicate key')) {
        console.error('Error creating profile:', profileError);
        // Don't throw - user is created, profile can be created later
      }

      // Return structured auth result
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      };
    } catch (error) {
      // Re-throw AuthError instances
      if (error instanceof AuthError) {
        throw error;
      }

      // Wrap unexpected errors
      console.error('Unexpected error during sign up:', error);
      throw new AuthError(
        'Wystąpił nieoczekiwany błąd podczas rejestracji. Spróbuj ponownie później.',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Sign out current user
   *
   * Terminates the user's session and clears authentication tokens.
   *
   * @param supabase - Supabase client instance
   * @throws AuthError if sign out fails
   */
  async signOut(supabase: SupabaseClient<Database>): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthError(
          'Nie udało się wylogować. Spróbuj ponownie.',
          'SIGNOUT_ERROR',
          error
        );
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      console.error('Unexpected error during sign out:', error);
      throw new AuthError(
        'Wystąpił nieoczekiwany błąd podczas wylogowania.',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Get current session
   *
   * Retrieves the current user's session if it exists and is valid.
   *
   * @param supabase - Supabase client instance
   * @returns Session data or null if no active session
   */
  async getSession(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return data.session;
  }

  /**
   * Translate Supabase Auth errors to Polish messages
   *
   * Maps common Supabase Auth error messages to user-friendly Polish text.
   *
   * @param errorMessage - Original error message from Supabase
   * @returns Polish error message
   * @private
   */
  private translateAuthError(errorMessage: string): string {
    const lowerMessage = errorMessage.toLowerCase();

    // Invalid credentials
    if (
      lowerMessage.includes('invalid login credentials') ||
      lowerMessage.includes('invalid email or password')
    ) {
      return 'Nieprawidłowy email lub hasło.';
    }

    // Email not confirmed
    if (lowerMessage.includes('email not confirmed')) {
      return 'Potwierdź swój adres email przed zalogowaniem.';
    }

    // User not found
    if (lowerMessage.includes('user not found')) {
      return 'Nie znaleziono użytkownika z podanym adresem email.';
    }

    // Too many requests / rate limit
    if (
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('rate limit')
    ) {
      return 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.';
    }

    // Account locked
    if (lowerMessage.includes('locked') || lowerMessage.includes('suspended')) {
      return 'Konto zostało zablokowane. Skontaktuj się z administratorem.';
    }

    // Network errors
    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout')
    ) {
      return 'Problem z połączeniem. Sprawdź swoje połączenie internetowe.';
    }

    // Generic fallback
    return 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
  }

  /**
   * Translate Supabase sign up errors to Polish messages
   *
   * @param errorMessage - Original error message from Supabase
   * @returns Polish error message
   * @private
   */
  private translateSignUpError(errorMessage: string): string {
    const lowerMessage = errorMessage.toLowerCase();

    // User already exists
    if (
      lowerMessage.includes('user already registered') ||
      lowerMessage.includes('email already exists') ||
      lowerMessage.includes('duplicate')
    ) {
      return 'Użytkownik z tym adresem email już istnieje.';
    }

    // Password too weak
    if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
      return 'Hasło jest zbyt słabe. Użyj silniejszego hasła.';
    }

    // Invalid email format
    if (lowerMessage.includes('invalid email')) {
      return 'Nieprawidłowy format adresu email.';
    }

    // Rate limiting
    if (
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('rate limit')
    ) {
      return 'Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę.';
    }

    // Network errors
    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout')
    ) {
      return 'Problem z połączeniem. Sprawdź swoje połączenie internetowe.';
    }

    // Generic fallback
    return 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
  }
}

// Export singleton instance for use across the application
export const authService = new AuthService();
