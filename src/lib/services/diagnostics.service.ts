import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { DiagnosticTestDTO, DiagnosticTestQuestionDTO } from "../../types";

/**
 * Diagnostics Service
 *
 * Handles all diagnostic test-related operations with the database.
 * Diagnostic tests assess student knowledge at the section level and
 * consist of questions from learning_content with usage_type = 'diagnostic_question'.
 */
export class DiagnosticsService {
  /**
   * Get diagnostic test for a specific section with all its questions
   *
   * Retrieves a diagnostic test by section_id along with all associated questions
   * from learning_content (filtered by usage_type = 'diagnostic_question').
   * Uses diagnostic_test_learning_content as the join table.
   *
   * Note: Diagnostic tests are reference data (RLS allows read access to authenticated users).
   * Only one test can exist per section (section_id has UNIQUE constraint).
   *
   * @param supabase - Authenticated Supabase client from context.locals
   * @param sectionId - UUID of the section to get diagnostic test for
   * @returns DiagnosticTestDTO with questions array, or null if no test exists for the section
   * @throws Error if database operation fails
   *
   * @example
   * const test = await diagnosticsService.getDiagnosticTestForSection(
   *   context.locals.supabase,
   *   'section-uuid-here'
   * );
   */
  async getDiagnosticTestForSection(
    supabase: SupabaseClient<Database>,
    sectionId: string
  ): Promise<DiagnosticTestDTO | null> {
    try {
      // 1. Fetch diagnostic test by section_id
      // Select only required columns for security and performance
      const { data: testData, error: testError } = await supabase
        .from("diagnostic_tests")
        .select("id, section_id, title, created_at")
        .eq("section_id", sectionId)
        .single(); // Expect exactly one result (section_id is UNIQUE)

      if (testError) {
        // Handle "not found" case gracefully (PGRST116 = no rows returned)
        if (testError.code === "PGRST116") {
          return null;
        }

        console.error("Error fetching diagnostic test:", {
          sectionId,
          message: testError.message,
          code: testError.code,
          details: testError.details,
        });
        throw new Error(`Database error: ${testError.message}`);
      }

      if (!testData) {
        return null;
      }

      // 2. Fetch related learning content via diagnostic_test_learning_content join table
      // We need to get all content_ids linked to this test, then fetch the actual content
      const { data: linkData, error: linkError } = await supabase
        .from("diagnostic_test_learning_content")
        .select(
          `
          content_id,
          learning_content (
            id,
            content,
            usage_type
          )
        `
        )
        .eq("test_id", testData.id);

      if (linkError) {
        console.error("Error fetching diagnostic test content:", {
          testId: testData.id,
          sectionId,
          message: linkError.message,
          code: linkError.code,
          details: linkError.details,
        });
        throw new Error(`Database error: ${linkError.message}`);
      }

      // 3. Filter for diagnostic_question usage_type and map to DiagnosticTestQuestionDTO
      // Handle cases where learning_content might be null or malformed
      const questions: DiagnosticTestQuestionDTO[] = (linkData || [])
        .filter((link) => {
          // Ensure learning_content exists and is of correct type
          if (!link.learning_content) {
            console.warn("Skipping link with null learning_content:", {
              testId: testData.id,
              contentId: link.content_id,
            });
            return false;
          }

          // Type assertion needed due to Supabase's nested select typing
          const content = link.learning_content as unknown as {
            id: string;
            content: Record<string, any>;
            usage_type: string;
          };

          if (content.usage_type !== "diagnostic_question") {
            console.warn("Skipping non-diagnostic content in test:", {
              testId: testData.id,
              contentId: content.id,
              usageType: content.usage_type,
            });
            return false;
          }

          return true;
        })
        .map((link) => {
          const content = link.learning_content as unknown as {
            id: string;
            content: Record<string, any>;
            usage_type: string;
          };

          return {
            id: content.id,
            content: content.content,
          } as DiagnosticTestQuestionDTO;
        });

      // 4. Build and return complete DiagnosticTestDTO
      const diagnosticTest: DiagnosticTestDTO = {
        id: testData.id,
        section_id: testData.section_id,
        title: testData.title,
        created_at: testData.created_at,
        questions,
      };

      console.info("Successfully fetched diagnostic test:", {
        testId: testData.id,
        sectionId,
        questionCount: questions.length,
      });

      return diagnosticTest;
    } catch (error) {
      // Re-throw database errors (already logged)
      if (error instanceof Error && error.message.startsWith("Database error:")) {
        throw error;
      }

      // Log and throw unexpected errors
      console.error("Unexpected error in getDiagnosticTestForSection:", {
        sectionId,
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Unexpected error fetching diagnostic test: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

// Export singleton instance for use across the application
export const diagnosticsService = new DiagnosticsService();
