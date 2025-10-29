import type { APIRoute } from "astro";
import { topicsService } from "../../../../lib/services/topics.service";
import { createSuccessResponse, ErrorResponses } from "../../../../lib/utils/api-response";

// Disable prerendering for API routes (required for server-side execution)
export const prerender = false;

/**
 * GET /api/topics/{topicId}/dependencies
 *
 * Returns the list of prerequisite topics (dependencies) for a specific topic.
 * Dependencies indicate which topics must be completed before studying the given topic.
 * Topics are public reference data but require authentication to access.
 *
 * @requires Authentication - JWT Bearer token in Authorization header or session cookies
 * @param topicId - UUID of the topic to get dependencies for
 *
 * @returns {TopicDependenciesResponseDTO} 200 - List of topic dependencies
 * @returns {ApiErrorResponseDTO} 400 - Invalid topic ID format
 * @returns {ApiErrorResponseDTO} 401 - Missing or invalid authentication token
 * @returns {ApiErrorResponseDTO} 404 - Topic not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/topics/550e8400-e29b-41d4-a716-446655440000/dependencies
 * Headers: { Authorization: "Bearer <jwt_token>" }
 *
 * // Success Response (200)
 * {
 *   "topic_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "dependencies": [
 *     {
 *       "id": "660e8400-e29b-41d4-a716-446655440001",
 *       "title": "Liczby rzeczywiste",
 *       "description": "Podstawowe operacje na liczbach rzeczywistych",
 *       "section_id": "770e8400-e29b-41d4-a716-446655440000",
 *       "section_title": "Algebra"
 *     }
 *   ]
 * }
 *
 * // Success Response - No dependencies (200)
 * {
 *   "topic_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "dependencies": []
 * }
 *
 * // Error Response (404)
 * {
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Temat nie został znaleziony"
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
      console.warn("GET /api/topics/:id/dependencies: No active session");
      return ErrorResponses.unauthorized("Brak aktywnej sesji. Zaloguj się ponownie.");
    }

    // 2. Get authenticated user (validates session is still valid)
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.warn("GET /api/topics/:id/dependencies: User validation failed", authError?.message);
      return ErrorResponses.unauthorized("Nieprawidłowa lub wygasła sesja.");
    }

    // 3. Extract and validate topicId parameter
    const { topicId } = params;

    if (!topicId) {
      console.warn("GET /api/topics/:id/dependencies: Missing topicId parameter");
      return ErrorResponses.badRequest("Identyfikator tematu jest wymagany", { field: "topicId" });
    }

    // 4. Verify topic exists before fetching dependencies
    let topic;
    try {
      topic = await topicsService.getTopicById(locals.supabase, topicId);
    } catch (error) {
      // Handle UUID validation errors
      if (error instanceof Error && error.message.includes("Invalid UUID format")) {
        console.warn("GET /api/topics/:id/dependencies: Invalid UUID format", {
          topicId,
        });
        return ErrorResponses.badRequest("Nieprawidłowy format identyfikatora tematu", {
          field: "topicId",
          value: topicId,
        });
      }
      throw error; // Re-throw unexpected errors
    }

    // 5. Handle not found case
    if (!topic) {
      console.info("GET /api/topics/:id/dependencies: Topic not found", {
        topicId,
        userId: user.id,
      });
      return ErrorResponses.notFound("Temat nie został znaleziony");
    }

    // 6. Fetch dependencies using service
    const response = await topicsService.getTopicDependencies(locals.supabase, topicId);

    // 7. Return success response
    console.info("GET /api/topics/:id/dependencies: Success", {
      topicId,
      userId: user.id,
      dependenciesCount: response.dependencies.length,
    });

    return createSuccessResponse(response);
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes("JWT") || error.message.includes("token") || error.message.includes("authenticated")) {
        console.warn("GET /api/topics/:id/dependencies: Authentication error", error.message);
        return ErrorResponses.unauthorized("Nieprawidłowy lub wygasły token uwierzytelniający.");
      }

      // Check for database connection errors
      if (
        error.message.includes("Database") ||
        error.message.includes("connection") ||
        error.message.includes("timeout")
      ) {
        console.error("GET /api/topics/:id/dependencies: Database error", error.message);
        return ErrorResponses.internalError("Błąd połączenia z bazą danych. Spróbuj ponownie później.");
      }
    }

    // Log unexpected errors with full context
    console.error("GET /api/topics/:id/dependencies: Unexpected error", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic internal error (don't expose internal details to client)
    return ErrorResponses.internalError();
  }
};
