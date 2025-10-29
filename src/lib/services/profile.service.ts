import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { ProfileDTO } from '../../types';

/**
 * Profile Service
 * 
 * Handles all profile-related operations with the database.
 * Uses Supabase client with Row Level Security (RLS) for secure data access.
 */
export class ProfileService {
  /**
   * Get the profile of the authenticated user
   * 
   * This method fetches the profile data for the currently authenticated user.
   * It relies on Supabase RLS policies to ensure users can only access their own profile.
   * 
   * @param supabase - Authenticated Supabase client from context.locals
   * @returns ProfileDTO if profile exists, null otherwise
   * @throws Error if user is not authenticated or database operation fails
   * 
   * @example
   * const profile = await profileService.getProfile(context.locals.supabase);
   */
  async getProfile(supabase: SupabaseClient<Database>): Promise<ProfileDTO | null> {
    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Query profiles table with RLS
    // The RLS policy automatically filters to only return the authenticated user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('id, login, email, has_completed_tutorial, created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Return null if no profile found (should not happen in normal flow)
    // This would indicate that the handle_new_user() trigger didn't execute properly
    return data;
  }
}

// Export singleton instance for use across the application
export const profileService = new ProfileService();

