import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
  UserProgressWithDetailsDTO,
  UserProgressSummaryDTO,
  UserProgressStatus
} from '../../types';

/**
 * Progress Service
 *
 * Handles all user progress-related operations with the database.
 * Uses Supabase client with Row Level Security (RLS) for secure data access.
 * RLS policies ensure users can only access their own progress data.
 */
export class ProgressService {
  /**
   * Get user progress overview with optional filters
   *
   * This method fetches all progress records for the authenticated user,
   * enriched with section and topic metadata. It supports optional filtering
   * by section and progress status.
   *
   * RLS policies automatically filter records to only return data for auth.uid().
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param filters - Optional filters for section_id and status
   * @returns Object containing progress array and summary statistics
   * @throws Error if database operation fails or user is not authenticated
   *
   * @example
   * // Get all progress
   * const result = await progressService.getUserProgressOverview(supabase, {});
   *
   * @example
   * // Filter by section
   * const result = await progressService.getUserProgressOverview(supabase, {
   *   sectionId: '550e8400-e29b-41d4-a716-446655440000'
   * });
   *
   * @example
   * // Filter by status
   * const result = await progressService.getUserProgressOverview(supabase, {
   *   status: 'completed'
   * });
   */
  async getUserProgressOverview(
    supabase: SupabaseClient<Database>,
    filters: {
      sectionId?: string;
      status?: UserProgressStatus;
    }
  ): Promise<{
    progress: UserProgressWithDetailsDTO[];
    summary: UserProgressSummaryDTO
  }> {
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Build query with joins to topics and sections
    // Using inner joins to ensure we only get progress records with valid topic/section relationships
    let query = supabase
      .from('user_progress')
      .select(`
        user_id,
        topic_id,
        status,
        score,
        updated_at,
        topics!inner (
          id,
          title,
          section_id,
          sections!inner (
            id,
            title
          )
        )
      `);

    // Apply optional filters
    // Note: Filtering on nested relations uses dot notation
    if (filters.sectionId) {
      query = query.eq('topics.section_id', filters.sectionId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user progress:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Map database results to UserProgressWithDetailsDTO
    // Handle nested structure from joins and ensure type safety
    const progress: UserProgressWithDetailsDTO[] = (data || []).map((row: any) => ({
      user_id: row.user_id,
      section_id: row.topics.sections.id,
      section_title: row.topics.sections.title,
      topic_id: row.topic_id,
      topic_title: row.topics.title,
      status: row.status as UserProgressStatus,
      score: row.score,
      updated_at: row.updated_at ?? null,
    }));

    // Calculate summary statistics from the progress array
    // This approach avoids an additional database round-trip
    const summary: UserProgressSummaryDTO = {
      total_topics: progress.length,
      completed: progress.filter(p => p.status === 'completed').length,
      in_progress: progress.filter(p => p.status === 'in_progress').length,
      not_started: progress.filter(p => p.status === 'not_started').length,
    };

    return { progress, summary };
  }
}

// Export singleton instance for use across the application
export const progressService = new ProgressService();
