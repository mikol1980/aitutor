// ============================================================================
// Supabase Browser Client
// ============================================================================
// Client-side Supabase instance for use in React components

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

/**
 * Get browser Supabase client instance
 * Uses public environment variables
 */
export function getSupabaseBrowserClient() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Get access token from current session
 * Returns null if no active session
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

