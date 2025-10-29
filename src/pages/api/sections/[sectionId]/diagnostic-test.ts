import type { APIRoute } from "astro";
import { z } from "zod";
import { sectionsService } from "../../../../lib/services/sections.service";
import { diagnosticsService } from "../../../../lib/services/diagnostics.service";
import { createSuccessResponse, ErrorResponses } from "../../../../lib/utils/api-response";
import type { DiagnosticTestDTO } from "../../../../types";

// Disable prerendering for API routes (required for server-side execution)
export const prerender = false;

// Zod schema for UUID validation
const UuidSchema = z.string().uuid({ message: "sectionId must be a valid UUID" });

/**
 * GET /api/sections/{sectionId}/diagnostic-test
 *
 * Returns a diagnostic test for a specific section along with its questions.
 * The test includes all questions from learning_content with usage_type = 'diagnostic_question'.
 *
 * @requires Authentication - JWT Bearer token in Authorization header or session cookies
 * @param sectionId - UUID v4 of the section to get diagnostic test for
 *
 * @returns {DiagnosticTestDTO} 200 - Diagnostic test with questions
 * @returns {ApiErrorResponseDTO} 400 - Invalid section ID format (not a valid UUID)
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication token
 * @returns {ApiErrorResponseDTO} 404 - Section not found or no diagnostic test assigned
 * @returns {ApiErrorResponseDTO} 500 - Internal server error (database error, unexpected error)
 *
 * @example
 * // Request
 * GET /api/sections/550e8400-e29b-41d4-a716-446655440000/diagnostic-test
 * Headers: { Authorization: "Bearer <jwt_token>" }
 *
 * // Success Response (200)
 * {
 *   "id": "uuid",
 *   "section_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "title": "Test diagnostyczny - Funkcje",
 *   "created_at": "2025-10-13T10:00:00Z",
 *   "questions": [
 *     {
 *       "id": "uuid",
 *       "content": {
 *         "question": "Co to jest funkcja?",
 *         "options": [
 *           "Przyporządkowanie każdemu x dokładnie jednego y",
 *           "Dowolna zależność między liczbami",
 *           "Wykres na płaszczyźnie",
 *           "Równanie matematyczne"
 *         ],
 *         "correct_answer_index": 0
 *       }
 *     },
 *     {
 *       "id": "uuid",
 *       "content": {
 *         "question": "Oblicz f(2) dla f(x) = 3x + 1",
 *         "type": "short_answer",
 *         "correct_answer": "7"
 *       }
 *     }
 *   ]
 * }
 *
 * // Error Response (404 - Section not found)
 * {
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Sekcja nie została znaleziona"
 *   }
 * }
 *
 * // Error Response (404 - No diagnostic test)
 * {
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Nie znaleziono testu diagnostycznego dla tej sekcji"
 *   }
 * }
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Get session from middleware (already restored from cookies)
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn("GET /api/sections/:id/diagnostic-test: No active session");
      return ErrorResponses.unauthorized("Brak aktywnej sesji. Zaloguj się ponownie.");
    }

    // 2. Get authenticated user (validates session is still valid)
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn(
        "GET /api/sections/:id/diagnostic-test: User validation failed",
        authError?.message
      );
      return ErrorResponses.unauthorized("Nieprawidłowa lub wygasła sesja.");
    }

    // 3. Extract and validate sectionId parameter
    const { sectionId } = params;

    if (!sectionId) {
      console.warn("GET /api/sections/:id/diagnostic-test: Missing sectionId parameter");
      return ErrorResponses.badRequest("Identyfikator sekcji jest wymagany", {
        field: "sectionId",
      });
    }

    // 4. Validate sectionId is a valid UUID using Zod
    const validationResult = UuidSchema.safeParse(sectionId);
    if (!validationResult.success) {
      console.warn("GET /api/sections/:id/diagnostic-test: Invalid UUID format", {
        sectionId,
        error: validationResult.error.errors[0]?.message,
      });
      return ErrorResponses.badRequest("Identyfikator sekcji musi być prawidłowym UUID", {
        field: "sectionId",
        value: sectionId,
      });
    }

    // 5. Verify section exists before fetching diagnostic test
    let section;
    try {
      section = await sectionsService.getSectionById(locals.supabase, sectionId);
    } catch (error) {
      // Handle UUID validation errors from service
      if (error instanceof Error && error.message.includes("Invalid UUID format")) {
        console.warn("GET /api/sections/:id/diagnostic-test: Invalid UUID from service", {
          sectionId,
        });
        return ErrorResponses.badRequest("Nieprawidłowy format identyfikatora sekcji", {
          field: "sectionId",
          value: sectionId,
        });
      }
      throw error; // Re-throw unexpected errors
    }

    if (!section) {
      console.info("GET /api/sections/:id/diagnostic-test: Section not found", {
        sectionId,
        userId: user.id,
      });
      return ErrorResponses.notFound("Sekcja nie została znaleziona");
    }

    // 6. Fetch diagnostic test for the section
    const diagnosticTest = await diagnosticsService.getDiagnosticTestForSection(
      locals.supabase,
      sectionId
    );

    if (!diagnosticTest) {
      console.info("GET /api/sections/:id/diagnostic-test: Diagnostic test not found", {
        sectionId,
        sectionTitle: section.title,
        userId: user.id,
      });
      return ErrorResponses.notFound("Nie znaleziono testu diagnostycznego dla tej sekcji");
    }

    // 7. Return success response with DiagnosticTestDTO format
    console.info("GET /api/sections/:id/diagnostic-test: Success", {
      sectionId,
      userId: user.id,
      sectionTitle: section.title,
      testId: diagnosticTest.id,
      questionCount: diagnosticTest.questions.length,
    });

    return createSuccessResponse<DiagnosticTestDTO>(diagnosticTest);
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (
        error.message.includes("JWT") ||
        error.message.includes("token") ||
        error.message.includes("authenticated")
      ) {
        console.warn(
          "GET /api/sections/:id/diagnostic-test: Authentication error",
          error.message
        );
        return ErrorResponses.unauthorized("Nieprawidłowy lub wygasły token uwierzytelniający.");
      }

      // Check for database connection errors
      if (
        error.message.includes("Database") ||
        error.message.includes("connection") ||
        error.message.includes("timeout")
      ) {
        console.error("GET /api/sections/:id/diagnostic-test: Database error", error.message);
        return ErrorResponses.internalError(
          "Błąd połączenia z bazą danych. Spróbuj ponownie później."
        );
      }
    }

    // Log unexpected errors with full context
    console.error("GET /api/sections/:id/diagnostic-test: Unexpected error", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};
