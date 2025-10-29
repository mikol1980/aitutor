import type { APIRoute } from "astro";
import { sectionsService } from "../../../lib/services/sections.service";
import { createSuccessResponse, ErrorResponses } from "../../../lib/utils/api-response";

// Disable prerendering for API routes (required for server-side execution)
export const prerender = false;

/**
 * GET /api/sections/{sectionId}
 *
 * Returns detailed information about a specific section by its UUID.
 * Sections are public reference data but require authentication to access.
 *
 * @requires Authentication - JWT Bearer token in Authorization header or session cookies
 * @param sectionId - UUID of the section to retrieve
 *
 * @returns {SectionDTO} 200 - Section details
 * @returns {ApiErrorResponseDTO} 400 - Invalid section ID format
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication token
 * @returns {ApiErrorResponseDTO} 404 - Section not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/sections/550e8400-e29b-41d4-a716-446655440000
 * Headers: { Authorization: "Bearer <jwt_token>" }
 *
 * // Success Response (200)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "title": "Funkcje",
 *   "description": "Zagadnienia związane z funkcjami matematycznymi",
 *   "display_order": 1,
 *   "created_at": "2025-10-13T10:00:00Z"
 * }
 *
 * // Error Response (404)
 * {
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Sekcja nie została znaleziona"
 *   }
 * }
 *
 * // Error Response (400)
 * {
 *   "error": {
 *     "code": "INVALID_INPUT",
 *     "message": "Nieprawidłowy format identyfikatora sekcji"
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
      console.warn("GET /api/sections/:id: No active session");
      return ErrorResponses.unauthorized("Brak aktywnej sesji. Zaloguj się ponownie.");
    }

    // 2. Get authenticated user (validates session is still valid)
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn("GET /api/sections/:id: User validation failed", authError?.message);
      return ErrorResponses.unauthorized("Nieprawidłowa lub wygasła sesja.");
    }

    // 3. Extract and validate sectionId parameter
    const { sectionId } = params;

    if (!sectionId) {
      console.warn("GET /api/sections/:id: Missing sectionId parameter");
      return ErrorResponses.badRequest("Identyfikator sekcji jest wymagany", { field: "sectionId" });
    }

    // 4. Fetch section using service (includes UUID validation)
    let section;
    try {
      section = await sectionsService.getSectionById(locals.supabase, sectionId);
    } catch (error) {
      // Handle UUID validation errors
      if (error instanceof Error && error.message.includes("Invalid UUID format")) {
        console.warn("GET /api/sections/:id: Invalid UUID format", {
          sectionId,
        });
        return ErrorResponses.badRequest("Nieprawidłowy format identyfikatora sekcji", {
          field: "sectionId",
          value: sectionId,
        });
      }
      throw error; // Re-throw unexpected errors
    }

    // 5. Handle not found case
    if (!section) {
      console.info("GET /api/sections/:id: Section not found", {
        sectionId,
        userId: user.id,
      });
      return ErrorResponses.notFound("Sekcja nie została znaleziona");
    }

    // 6. Return success response
    console.info("GET /api/sections/:id: Success", {
      sectionId,
      userId: user.id,
      sectionTitle: section.title,
    });

    return createSuccessResponse(section);
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes("JWT") || error.message.includes("token") || error.message.includes("authenticated")) {
        console.warn("GET /api/sections/:id: Authentication error", error.message);
        return ErrorResponses.unauthorized("Nieprawidłowy lub wygasły token uwierzytelniający.");
      }

      // Check for database connection errors
      if (
        error.message.includes("Database") ||
        error.message.includes("connection") ||
        error.message.includes("timeout")
      ) {
        console.error("GET /api/sections/:id: Database error", error.message);
        return ErrorResponses.internalError("Błąd połączenia z bazą danych. Spróbuj ponownie później.");
      }
    }

    // Log unexpected errors with full context
    console.error("GET /api/sections/:id: Unexpected error", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};
