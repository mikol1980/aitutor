import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';

/**
 * Middleware for Supabase authentication
 *
 * Creates a Supabase client for each request with automatic session handling.
 * The client uses cookies for session persistence.
 *
 * The client is available in all Astro pages and API routes via `Astro.locals.supabase`
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create a Supabase client instance
  const supabase = createClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      auth: {
        // Enable automatic cookie management
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  // Try to restore session from cookies if available
  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  if (accessToken && refreshToken) {
    // Restore the session from cookies
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Make the client available in context.locals
  context.locals.supabase = supabase;

  // Process the request
  const response = await next();

  // After request processing, update cookies if session changed
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Update cookies with current session
    context.cookies.set('sb-access-token', session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    context.cookies.set('sb-refresh-token', session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } else {
    // No session - clear cookies
    context.cookies.delete('sb-access-token', { path: '/' });
    context.cookies.delete('sb-refresh-token', { path: '/' });
  }

  return response;
});
