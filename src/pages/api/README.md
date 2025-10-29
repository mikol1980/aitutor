# API Endpoints Documentation

This directory contains all REST API endpoints for the AI Tutor application.

## Structure

```
src/pages/api/
├── profile.ts          # User profile endpoints
└── README.md          # This file
```

## Available Endpoints

### Profile Management

#### GET /api/profile
Returns the authenticated user's profile information.

**Authentication:** Required (JWT Bearer token)

**Request:**
```bash
GET /api/profile
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "login": "student123",
  "email": "student@example.com",
  "has_completed_tutorial": false,
  "created_at": "2025-10-13T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Profile not found
- `500 Internal Server Error` - Server error

**Implementation Details:**
- Uses Row Level Security (RLS) via Supabase
- Token must be valid and not expired
- Users can only access their own profile

---

## Development

### Testing Endpoints

Use the provided test script:

```bash
# Test without token (tests error cases)
./test-profile-endpoint.sh

# Test with valid token (tests success case)
./test-profile-endpoint.sh YOUR_JWT_TOKEN
```

Or use curl directly:

```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Getting a Test Token

1. **Via Supabase Dashboard:**
   - Go to Authentication → Users
   - Select or create a test user
   - Generate access token

2. **Via Auth Endpoint (when implemented):**
   ```bash
   curl -X POST http://localhost:4321/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

### Adding New Endpoints

When creating new API endpoints:

1. **Create the file:** `src/pages/api/your-endpoint.ts`
2. **Export HTTP method handlers:** `GET`, `POST`, `PUT`, `DELETE`
3. **Use services:** Keep business logic in `src/lib/services/`
4. **Use helpers:** Import from `src/lib/utils/api-response.ts`
5. **Follow the pattern:**
   ```typescript
   import type { APIRoute } from 'astro';
   import { createSuccessResponse, ErrorResponses } from '../../lib/utils/api-response';
   
   export const GET: APIRoute = async ({ request, locals }) => {
     try {
       // 1. Validate authentication
       // 2. Validate input
       // 3. Call service
       // 4. Return response
     } catch (error) {
       // Handle errors
       return ErrorResponses.internalError();
     }
   };
   ```

### Error Handling

All endpoints should use standardized error responses from `api-response.ts`:

```typescript
// Pre-configured responses
ErrorResponses.unauthorized('Custom message');
ErrorResponses.notFound('Resource not found');
ErrorResponses.internalError();
ErrorResponses.badRequest('Invalid input', { field: 'email' });

// Or create custom
createErrorResponse('CUSTOM_CODE', 'Message', 400);
```

### Logging

Use appropriate log levels:

```typescript
console.info('Operation successful', { context });  // Success operations
console.warn('Validation failed', { reason });      // Expected errors (401, 404)
console.error('Unexpected error', { error });       // Server errors (500)
```

### Authentication

All protected endpoints should:

1. Check for `Authorization` header
2. Validate JWT token format
3. Use `locals.supabase` from middleware
4. Call `supabase.auth.getUser(token)` to validate
5. Handle authentication errors appropriately

Example:

```typescript
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return ErrorResponses.unauthorized('Missing authentication token');
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await locals.supabase.auth.getUser(token);

if (error || !user) {
  return ErrorResponses.unauthorized('Invalid or expired token');
}
```

---

## References

- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Implementation Plans](.ai/profile-implementation-plan.md)
- [API Specification](.ai/api-plan.md)

