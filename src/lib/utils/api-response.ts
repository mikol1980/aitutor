import type { ApiErrorResponseDTO } from '../../types';

/**
 * Create a standardized JSON error response
 * 
 * This helper function ensures consistent error response formatting across all API endpoints.
 * All error responses follow the ApiErrorResponseDTO structure.
 * 
 * @param code - Error code identifier (e.g., 'UNAUTHORIZED', 'NOT_FOUND')
 * @param message - Human-readable error message for the client
 * @param status - HTTP status code
 * @param details - Optional additional error details (e.g., validation errors)
 * @returns Response object with JSON error body and appropriate headers
 * 
 * @example
 * return createErrorResponse('NOT_FOUND', 'Profile not found', 404);
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, any>
): Response {
  const body: ApiErrorResponseDTO = {
    error: {
      code,
      message,
      ...(details && { details })
    }
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create a standardized JSON success response
 * 
 * This helper function ensures consistent success response formatting.
 * 
 * @param data - The data to return in the response body
 * @param status - HTTP status code (defaults to 200)
 * @returns Response object with JSON body and appropriate headers
 * 
 * @example
 * return createSuccessResponse(profile, 200);
 */
export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Common error responses
 * 
 * Pre-configured error response creators for common HTTP error scenarios.
 * These ensure consistency in error messages across the API.
 */
export const ErrorResponses = {
  /**
   * 401 Unauthorized - Missing or invalid authentication
   */
  unauthorized: (message: string = 'Missing or invalid authentication token') =>
    createErrorResponse('UNAUTHORIZED', message, 401),
  
  /**
   * 404 Not Found - Requested resource doesn't exist
   */
  notFound: (message: string = 'Resource not found') =>
    createErrorResponse('NOT_FOUND', message, 404),
  
  /**
   * 500 Internal Server Error - Unexpected server error
   */
  internalError: (message: string = 'An unexpected error occurred. Please try again later.') =>
    createErrorResponse('INTERNAL_ERROR', message, 500),
  
  /**
   * 400 Bad Request - Invalid input data
   */
  badRequest: (message: string, details?: Record<string, any>) =>
    createErrorResponse('INVALID_INPUT', message, 400, details),

  /**
   * 403 Forbidden - Access to resource denied
   */
  forbidden: (message: string = 'Access to this resource is forbidden') =>
    createErrorResponse('FORBIDDEN', message, 403)
};

