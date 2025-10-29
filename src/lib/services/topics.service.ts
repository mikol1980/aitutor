import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  TopicDTO,
  TopicDependenciesResponseDTO,
  TopicDependencyDTO,
  LearningContentDTO,
  LearningContentListResponseDTO,
  ContentUsageType,
} from "../../types";

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

  /**
   * Get a single topic by ID
   *
   * Retrieves a specific topic from the database by its UUID.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param topicId - UUID of the topic to retrieve
   * @returns TopicDTO if found, null if topic doesn't exist
   * @throws Error if database operation fails or topicId is invalid
   *
   * @example
   * const topic = await topicsService.getTopicById(context.locals.supabase, 'uuid-here');
   */
  async getTopicById(supabase: SupabaseClient<Database>, topicId: string): Promise<TopicDTO | null> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(topicId)) {
      throw new Error("Invalid UUID format");
    }

    try {
      const { data, error } = await supabase
        .from("topics")
        .select("id, section_id, title, description, display_order, created_at")
        .eq("id", topicId)
        .single();

      if (error) {
        // Handle "not found" case gracefully
        if (error.code === "PGRST116") {
          return null;
        }
        console.error("Error fetching topic by id:", {
          topicId,
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw new Error(`Database error: ${error.message}`);
      }

      return data as unknown as TopicDTO;
    } catch (e) {
      console.error("Unexpected error in getTopicById:", e);
      throw e;
    }
  }

  /**
   * Get all dependencies (prerequisites) for a topic
   *
   * Retrieves the list of topics that must be completed before the given topic.
   * Joins topic_dependencies with topics and sections to provide complete information.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param topicId - UUID of the topic to get dependencies for
   * @returns TopicDependenciesResponseDTO with topic_id and array of dependencies
   * @throws Error if database operation fails
   *
   * @example
   * const deps = await topicsService.getTopicDependencies(context.locals.supabase, 'uuid-here');
   */
  async getTopicDependencies(
    supabase: SupabaseClient<Database>,
    topicId: string
  ): Promise<TopicDependenciesResponseDTO> {
    try {
      // Strategy: join topic_dependencies → topics (dependency) → sections (for section_title)
      const { data, error } = await supabase
        .from("topic_dependencies")
        .select(
          `
          dependency:topics!topic_dependencies_dependency_id_fkey (
            id,
            title,
            description,
            section_id,
            sections ( title )
          )
        `
        )
        .eq("topic_id", topicId);

      if (error) {
        console.error("Error fetching topic dependencies:", {
          topicId,
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw new Error(`Database error: ${error.message}`);
      }

      // Map database response to DTO format
      // Note: row structure from JOIN: { dependency: { id, title, description, section_id, sections: { title } } }
      const dependencies: TopicDependencyDTO[] = (data || []).map(
        (row: {
          dependency: {
            id: string;
            title: string;
            description: string | null;
            section_id: string;
            sections: { title: string } | null;
          } | null;
        }) => ({
          id: row.dependency?.id ?? "",
          title: row.dependency?.title ?? "",
          description: row.dependency?.description ?? null,
          section_id: row.dependency?.section_id ?? "",
          section_title: row.dependency?.sections?.title ?? "",
        })
      );

      return { topic_id: topicId, dependencies };
    } catch (e) {
      console.error("Unexpected error in getTopicDependencies:", e);
      throw e;
    }
  }

  /**
   * Get learning content for a topic with optional filters
   *
   * Retrieves all learning materials associated with a topic.
   * Can filter by usage_type (explanation/exercise/diagnostic_question) and verification status.
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param topicId - UUID of the topic to get content for
   * @param usageType - Optional filter by content usage type
   * @param isVerified - Optional filter by verification status
   * @returns LearningContentListResponseDTO with array of content items
   * @throws Error if database operation fails
   *
   * @example
   * const content = await topicsService.getLearningContent(
   *   context.locals.supabase,
   *   'uuid-here',
   *   'explanation',
   *   true
   * );
   */
  async getLearningContent(
    supabase: SupabaseClient<Database>,
    topicId: string,
    usageType?: ContentUsageType,
    isVerified?: boolean
  ): Promise<LearningContentListResponseDTO> {
    try {
      let query = supabase
        .from("learning_content")
        .select("id, topic_id, usage_type, content, is_verified, created_at")
        .eq("topic_id", topicId);

      if (usageType) {
        query = query.eq("usage_type", usageType);
      }
      if (typeof isVerified === "boolean") {
        query = query.eq("is_verified", isVerified);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching learning content:", {
          topicId,
          usageType,
          isVerified,
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw new Error(`Database error: ${error.message}`);
      }

      return { content: (data || []) as unknown as LearningContentDTO[] };
    } catch (e) {
      console.error("Unexpected error in getLearningContent:", e);
      throw e;
    }
  }
}

// Export singleton instance for use across the application
export const topicsService = new TopicsService();
