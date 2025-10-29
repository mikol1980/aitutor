# API Endpoints Documentation

This directory contains all REST API endpoints for the AI Tutor application.

## Structure

```
src/pages/api/
├── auth/
│   ├── login.ts             # Authentication - login
│   └── register.ts          # Authentication - register
├── sections/
│   ├── [sectionId].ts       # Get section details
│   └── [sectionId]/
│       └── topics.ts        # Get topics for section
├── topics/
│   └── [topicId]/
│       ├── index.ts         # Get topic details
│       ├── dependencies.ts  # Get topic dependencies
│       └── content.ts       # Get learning content for topic
├── sessions/
│   └── [sessionId]/
│       ├── index.ts         # Get session details
│       ├── messages.ts      # Get/create session messages
│       └── end.ts           # End learning session
├── profile.ts               # User profile endpoints
├── sections.ts              # List all sections
└── README.md                # This file
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

### Topic Management

#### GET /api/topics/{topicId}
Returns detailed information about a specific topic.

**Authentication:** Required (JWT Bearer token)

**Parameters:**
- `topicId` (path) - UUID of the topic to retrieve

**Request:**
```bash
GET /api/topics/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "section_id": "660e8400-e29b-41d4-a716-446655440000",
  "title": "Funkcje liniowe",
  "description": "Podstawy funkcji liniowych y = ax + b",
  "display_order": 1,
  "created_at": "2025-10-13T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid topic ID format
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Topic not found
- `500 Internal Server Error` - Server error

---

#### GET /api/topics/{topicId}/dependencies
Returns the list of prerequisite topics (dependencies) for a specific topic.

**Authentication:** Required (JWT Bearer token)

**Parameters:**
- `topicId` (path) - UUID of the topic

**Request:**
```bash
GET /api/topics/550e8400-e29b-41d4-a716-446655440000/dependencies
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "topic_id": "550e8400-e29b-41d4-a716-446655440000",
  "dependencies": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Liczby rzeczywiste",
      "description": "Podstawowe operacje na liczbach rzeczywistych",
      "section_id": "770e8400-e29b-41d4-a716-446655440000",
      "section_title": "Algebra"
    }
  ]
}
```

**Success Response - No dependencies (200):**
```json
{
  "topic_id": "550e8400-e29b-41d4-a716-446655440000",
  "dependencies": []
}
```

**Error Responses:**
- `400 Bad Request` - Invalid topic ID format
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Topic not found
- `500 Internal Server Error` - Server error

**Implementation Details:**
- Returns empty array if topic has no prerequisites
- Includes section information for each dependency via JOIN
- Dependencies indicate required prior knowledge

---

#### GET /api/topics/{topicId}/content
Returns learning content (materials) for a specific topic with optional filtering.

**Authentication:** Required (JWT Bearer token)

**Parameters:**
- `topicId` (path) - UUID of the topic
- `usage_type` (query, optional) - Filter by content type: `explanation`, `exercise`, or `diagnostic_question`
- `is_verified` (query, optional) - Filter by verification status: `true` or `false`

**Request Examples:**
```bash
# Get all content
GET /api/topics/550e8400-e29b-41d4-a716-446655440000/content
Authorization: Bearer <jwt_token>

# Get only verified explanations
GET /api/topics/550e8400-e29b-41d4-a716-446655440000/content?usage_type=explanation&is_verified=true

# Get all exercises
GET /api/topics/550e8400-e29b-41d4-a716-446655440000/content?usage_type=exercise
```

**Success Response (200):**
```json
{
  "content": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "topic_id": "550e8400-e29b-41d4-a716-446655440000",
      "usage_type": "explanation",
      "content": {
        "type": "text",
        "text": "Funkcja liniowa to funkcja postaci y = ax + b..."
      },
      "is_verified": true,
      "created_at": "2025-10-13T10:00:00Z"
    }
  ]
}
```

**Success Response - No content (200):**
```json
{
  "content": []
}
```

**Error Responses:**
- `400 Bad Request` - Invalid topic ID or query parameters
  - Invalid `usage_type` value
  - Invalid `is_verified` value (must be 'true' or 'false')
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Topic not found
- `500 Internal Server Error` - Server error

**Implementation Details:**
- All filters are optional
- Filters can be combined (e.g., verified exercises only)
- Returns empty array if no content matches filters
- Content is stored as JSONB in database (flexible structure)

---

## Development

### Testing Endpoints

Use the provided test scripts:

```bash
# Test profile endpoint
./test-profile-endpoint.sh YOUR_JWT_TOKEN

# Test sections endpoints
./test-sections-endpoint.sh YOUR_JWT_TOKEN

# Test sessions endpoints
./test-session-endpoint.sh YOUR_JWT_TOKEN SESSION_ID

# Test topics endpoints (all three endpoints)
./test-topics-endpoint.sh YOUR_JWT_TOKEN TOPIC_ID
```

Or use curl directly:

```bash
# Get topic details
curl -X GET http://localhost:4321/api/topics/TOPIC_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get topic dependencies
curl -X GET http://localhost:4321/api/topics/TOPIC_ID/dependencies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get topic content with filters
curl -X GET "http://localhost:4321/api/topics/TOPIC_ID/content?usage_type=explanation&is_verified=true" \
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

