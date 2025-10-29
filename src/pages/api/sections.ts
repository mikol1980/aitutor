import type { APIRoute } from "astro";
import { sectionsService } from "../../lib/services/sections.service";
import { createSuccessResponse, ErrorResponses } from "../../lib/utils/api-response";
import type { SectionListResponseDTO } from "../../types";

// Disable prerendering for API routes (required for server-side execution)
export const prerender = false;

/**
 * GET /api/sections
 *
 * Returns a list of all sections (broad subject areas) ordered by display_order.
 * Sections are public reference data but require authentication to access.
 *
 * @requires Authentication - JWT Bearer token in Authorization header or session cookies
 *
 * @returns {SectionListResponseDTO} 200 - List of sections
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication token
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/sections
 * Headers: { Authorization: "Bearer <jwt_token>" }
 *
 * // Success Response (200)
 * {
 *   "sections": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "title": "Funkcje",
 *       "description": "Zagadnienia związane z funkcjami matematycznymi",
 *       "display_order": 1,
 *       "created_at": "2025-10-13T10:00:00Z"
 *     }
 *   ]
 * }
 *
 * // Error Response (401)
 * {
 *   "error": {
 *     "code": "UNAUTHORIZED",
 *     "message": "Brak aktywnej sesji"
 *   }
 * }
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Get session from middleware (already restored from cookies)
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn("GET /api/sections: No active session");
      return ErrorResponses.unauthorized("Brak aktywnej sesji. Zaloguj się ponownie.");
    }

    // 2. Get authenticated user (validates session is still valid)
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn("GET /api/sections: User validation failed", authError?.message);
      return ErrorResponses.unauthorized("Nieprawidłowa lub wygasła sesja.");
    }

    // 3. Fetch sections using service
    // Sections are public reference data, but authentication is required to access API
    const sections = await sectionsService.listSections(locals.supabase);

    // 4. Return success response with SectionListResponseDTO format
    const response: SectionListResponseDTO = { sections };

    console.info("GET /api/sections: Success", {
      userId: user.id,
      sectionCount: sections.length,
    });

    return createSuccessResponse<SectionListResponseDTO>(response);
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes("JWT") || error.message.includes("token") || error.message.includes("authenticated")) {
        console.warn("GET /api/sections: Authentication error", error.message);
        return ErrorResponses.unauthorized("Nieprawidłowy lub wygasły token uwierzytelniający.");
      }

      // Check for database connection errors
      if (
        error.message.includes("Database") ||
        error.message.includes("connection") ||
        error.message.includes("timeout")
      ) {
        console.error("GET /api/sections: Database error", error.message);
        return ErrorResponses.internalError("Błąd połączenia z bazą danych. Spróbuj ponownie później.");
      }
    }

    // Log unexpected errors with full context
    console.error("GET /api/sections: Unexpected error", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};
