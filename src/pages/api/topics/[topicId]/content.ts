import type { APIRoute } from "astro";
import { z } from "zod";
import { topicsService } from "../../../../lib/services/topics.service";
import { createSuccessResponse, ErrorResponses } from "../../../../lib/utils/api-response";
import type { ContentUsageType } from "../../../../types";

// Disable prerendering for API routes (required for server-side execution)
export const prerender = false;

/**
 * Zod schema for content query parameters
 */
const ContentQuerySchema = z.object({
  usage_type: z.enum(["explanation", "exercise", "diagnostic_question"]).optional(),
  is_verified: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      throw new Error("is_verified must be 'true' or 'false'");
    }),
});

/**
 * GET /api/topics/{topicId}/content
 *
 * Returns learning content (materials) for a specific topic with optional filtering.
 * Content can be filtered by usage type (explanation/exercise/diagnostic_question)
 * and verification status.
 *
 * @requires Authentication - JWT Bearer token in Authorization header or session cookies
 * @param topicId - UUID of the topic to get content for (path parameter)
 * @param usage_type - Optional filter by content type (query param)
 * @param is_verified - Optional filter by verification status: 'true' or 'false' (query param)
 *
 * @returns {LearningContentListResponseDTO} 200 - List of learning content items
 * @returns {ApiErrorResponseDTO} 400 - Invalid topic ID or query parameters
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication token
 * @returns {ApiErrorResponseDTO} 404 - Topic not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request - Get all content
 * GET /api/topics/550e8400-e29b-41d4-a716-446655440000/content
 * Headers: { Authorization: "Bearer <jwt_token>" }
 *
 * // Request - Get only verified explanations
 * GET /api/topics/550e8400-e29b-41d4-a716-446655440000/content?usage_type=explanation&is_verified=true
 *
 * // Success Response (200)
 * {
 *   "content": [
 *     {
 *       "id": "770e8400-e29b-41d4-a716-446655440000",
 *       "topic_id": "550e8400-e29b-41d4-a716-446655440000",
 *       "usage_type": "explanation",
 *       "content": {
 *         "type": "text",
 *         "text": "Funkcja liniowa to funkcja postaci y = ax + b..."
 *       },
 *       "is_verified": true,
 *       "created_at": "2025-10-13T10:00:00Z"
 *     }
 *   ]
 * }
 *
 * // Success Response - No content (200)
 * {
 *   "content": []
 * }
 *
 * // Error Response (400) - Invalid usage_type
 * {
 *   "error": {
 *     "code": "INVALID_INPUT",
 *     "message": "Nieprawidłowy typ materiału. Dozwolone: explanation, exercise, diagnostic_question"
 *   }
 * }
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    // 1. Get session from middleware (already restored from cookies)
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn("GET /api/topics/:id/content: No active session");
      return ErrorResponses.unauthorized("Brak aktywnej sesji. Zaloguj się ponownie.");
    }

    // 2. Get authenticated user (validates session is still valid)
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn("GET /api/topics/:id/content: User validation failed", authError?.message);
      return ErrorResponses.unauthorized("Nieprawidłowa lub wygasła sesja.");
    }

    // 3. Extract and validate topicId parameter
    const { topicId } = params;

    if (!topicId) {
      console.warn("GET /api/topics/:id/content: Missing topicId parameter");
      return ErrorResponses.badRequest("Identyfikator tematu jest wymagany", { field: "topicId" });
    }

    // 4. Parse and validate query parameters
    const queryParams = {
      usage_type: url.searchParams.get("usage_type"),
      is_verified: url.searchParams.get("is_verified"),
    };

    const queryValidation = ContentQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      const firstError = queryValidation.error.errors[0];
      const errorMessage =
        firstError?.path[0] === "usage_type"
          ? "Nieprawidłowy typ materiału. Dozwolone: explanation, exercise, diagnostic_question"
          : firstError?.path[0] === "is_verified"
            ? "Parametr is_verified musi być 'true' lub 'false'"
            : "Nieprawidłowe parametry zapytania";

      console.warn("GET /api/topics/:id/content: Invalid query parameters", {
        topicId,
        queryParams,
        error: firstError?.message,
      });

      return ErrorResponses.badRequest(errorMessage, {
        field: firstError?.path[0],
        value: queryParams[firstError?.path[0] as keyof typeof queryParams],
      });
    }

    const { usage_type, is_verified } = queryValidation.data;

    // 5. Verify topic exists before fetching content
    let topic;
    try {
      topic = await topicsService.getTopicById(locals.supabase, topicId);
    } catch (error) {
      // Handle UUID validation errors
      if (error instanceof Error && error.message.includes("Invalid UUID format")) {
        console.warn("GET /api/topics/:id/content: Invalid UUID format", {
          topicId,
        });
        return ErrorResponses.badRequest("Nieprawidłowy format identyfikatora tematu", {
          field: "topicId",
          value: topicId,
        });
      }
      throw error; // Re-throw unexpected errors
    }

    // 6. Handle not found case
    if (!topic) {
      console.info("GET /api/topics/:id/content: Topic not found", {
        topicId,
        userId: user.id,
      });
      return ErrorResponses.notFound("Temat nie został znaleziony");
    }

    // 7. Fetch learning content using service with optional filters
    const response = await topicsService.getLearningContent(
      locals.supabase,
      topicId,
      usage_type as ContentUsageType | undefined,
      is_verified
    );

    // 8. Return success response
    console.info("GET /api/topics/:id/content: Success", {
      topicId,
      userId: user.id,
      contentCount: response.content.length,
      filters: { usage_type, is_verified },
    });

    return createSuccessResponse(response);
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes("JWT") || error.message.includes("token") || error.message.includes("authenticated")) {
        console.warn("GET /api/topics/:id/content: Authentication error", error.message);
        return ErrorResponses.unauthorized("Nieprawidłowy lub wygasły token uwierzytelniający.");
      }

      // Check for database connection errors
      if (
        error.message.includes("Database") ||
        error.message.includes("connection") ||
        error.message.includes("timeout")
      ) {
        console.error("GET /api/topics/:id/content: Database error", error.message);
        return ErrorResponses.internalError("Błąd połączenia z bazą danych. Spróbuj ponownie później.");
      }
    }

    // Log unexpected errors with full context
    console.error("GET /api/topics/:id/content: Unexpected error", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};
