import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { TopicDTO } from "../../types";

/**
 * Topics Service
 *
 * Handles all topics-related operations with the database.
 * Topics represent specific concepts within sections (e.g., "Linear Functions" within "Functions")
 * and are public reference data accessible to all authenticated users.
 */
export class TopicsService {
  /**
   * Get all topics for a specific section, ordered by display_order
   *
   * Retrieves all topics belonging to a section from the database sorted by display_order (ascending).
   * Secondary sort by id ensures stable ordering when display_order values are identical.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param sectionId - UUID of the section to get topics for
   * @returns Array of TopicDTO objects, empty array if no topics exist for the section
   * @throws Error if database operation fails or sectionId is invalid
   *
   * @example
   * const topics = await topicsService.listTopicsBySection(context.locals.supabase, 'section-uuid');
   */
  async listTopicsBySection(supabase: SupabaseClient<Database>, sectionId: string): Promise<TopicDTO[]> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sectionId)) {
      throw new Error("Invalid UUID format");
    }

    // Query topics table with explicit column selection (avoid SELECT *)
    // for security and performance
    const { data, error } = await supabase
      .from("topics")
      .select("id, section_id, title, description, display_order, created_at")
      .eq("section_id", sectionId)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true }); // Secondary sort for stability

    if (error) {
      console.error("Error fetching topics for section:", {
        sectionId,
        message: error.message,
        code: error.code,
        details: error.details,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    // Return empty array if no topics found (valid state for sections without topics yet)
    return data || [];
  }
}

// Export singleton instance for use across the application
export const topicsService = new TopicsService();
