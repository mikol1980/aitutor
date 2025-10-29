import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { SectionDTO } from "../../types";

/**
 * Sections Service
 *
 * Handles all sections-related operations with the database.
 * Sections represent broad subject areas (e.g., Algebra, Geometry)
 * and are public reference data accessible to all authenticated users.
 */
export class SectionsService {
  /**
   * Get all sections ordered by display_order
   *
   * Retrieves all sections from the database sorted by display_order (ascending).
   * Secondary sort by id ensures stable ordering when display_order values are identical.
   *
   * Note: Sections table has RLS disabled (public reference data), but authentication
   * is still required at the endpoint level.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @returns Array of SectionDTO objects, empty array if no sections exist
   * @throws Error if database operation fails
   *
   * @example
   * const sections = await sectionsService.listSections(context.locals.supabase);
   */
  async listSections(supabase: SupabaseClient<Database>): Promise<SectionDTO[]> {
    // Query sections table with explicit column selection (avoid SELECT *)
    // for security and performance
    const { data, error } = await supabase
      .from("sections")
      .select("id, title, description, display_order, created_at")
      .order("display_order", { ascending: true })
      .order("id", { ascending: true }); // Secondary sort for stability

    if (error) {
      console.error("Error fetching sections:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    // Return empty array if no sections found (valid state for new installations)
    return data || [];
  }

  /**
   * Get a single section by ID
   *
   * Retrieves a specific section from the database by its UUID.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param sectionId - UUID of the section to retrieve
   * @returns SectionDTO if found, null if section doesn't exist
   * @throws Error if database operation fails or sectionId is invalid
   *
   * @example
   * const section = await sectionsService.getSectionById(context.locals.supabase, 'uuid-here');
   */
  async getSectionById(supabase: SupabaseClient<Database>, sectionId: string): Promise<SectionDTO | null> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sectionId)) {
      throw new Error("Invalid UUID format");
    }

    // Query specific section by ID
    const { data, error } = await supabase
      .from("sections")
      .select("id, title, description, display_order, created_at")
      .eq("id", sectionId)
      .single(); // Expects exactly one result

    if (error) {
      // Handle "not found" case gracefully
      if (error.code === "PGRST116") {
        return null;
      }

      console.error("Error fetching section by ID:", {
        sectionId,
        message: error.message,
        code: error.code,
        details: error.details,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }
}

// Export singleton instance for use across the application
export const sectionsService = new SectionsService();
