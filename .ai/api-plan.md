# REST API Plan for AI Tutor

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Profile | `profiles` | User profile data linked to Supabase Auth |
| Section | `sections` | Main subject areas (e.g., "Functions") |
| Topic | `topics` | Specific concepts within sections |
| Topic Dependencies | `topic_dependencies` | Prerequisites between topics |
| Learning Content | `learning_content` | Educational materials (explanations, exercises, questions) |
| Diagnostic Test | `diagnostic_tests` | Assessment tests for sections |
| Diagnostic Test Attempt | `diagnostic_test_attempts` | User's test attempts with scores |
| User Answer | `user_answers` | Individual answers within test attempts |
| Session | `sessions` | Learning session records |
| Session Message | `session_messages` | Conversation transcripts within sessions |
| User Progress | `user_progress` | User's mastery tracking per topic |

## 2. Endpoints

### 2.1 Authentication & Profile

#### Sign Up
**Endpoint:** Handled by Supabase Auth  
**Method:** `POST`  
**Path:** `/auth/v1/signup`  
**Description:** Register a new user. Automatically triggers profile creation via database trigger.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123",
  "data": {
    "login": "student123"
  }
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "user_metadata": {
      "login": "student123"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email format or password too weak
- `422 Unprocessable Entity` - Email already registered

**Validation:**
- Email: valid email format, unique
- Password: minimum 6 characters (Supabase default)
- Login: minimum 3 characters

---

#### Sign In
**Endpoint:** Handled by Supabase Auth  
**Method:** `POST`  
**Path:** `/auth/v1/token?grant_type=password`  
**Description:** Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid credentials
- `401 Unauthorized` - Email not confirmed

---

#### Get Current User Profile
**Method:** `GET`  
**Path:** `/api/profile`  
**Description:** Retrieve the authenticated user's profile information.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "id": "uuid",
  "login": "student123",
  "email": "student@example.com",
  "has_completed_tutorial": false,
  "created_at": "2025-10-13T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Profile not found

---

#### Update User Profile
**Method:** `PUT`  
**Path:** `/api/profile`  
**Description:** Update the authenticated user's profile (primarily for tutorial completion).

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "has_completed_tutorial": true
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "login": "student123",
  "email": "student@example.com",
  "has_completed_tutorial": true,
  "created_at": "2025-10-13T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid request body

**Validation:**
- `has_completed_tutorial`: boolean

---

### 2.2 Knowledge Structure

#### List All Sections
**Method:** `GET`  
**Path:** `/api/sections`  
**Description:** Retrieve all subject sections ordered by display order.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- None (all sections are returned as the list is small)

**Success Response (200):**
```json
{
  "sections": [
    {
      "id": "uuid",
      "title": "Funkcje",
      "description": "Zagadnienia związane z funkcjami matematycznymi",
      "display_order": 1,
      "created_at": "2025-10-13T10:00:00Z"
    },
    {
      "id": "uuid",
      "title": "Geometria",
      "description": "Zagadnienia z zakresu geometrii",
      "display_order": 2,
      "created_at": "2025-10-13T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

#### Get Section Details
**Method:** `GET`  
**Path:** `/api/sections/{sectionId}`  
**Description:** Retrieve detailed information about a specific section.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "id": "uuid",
  "title": "Funkcje",
  "description": "Zagadnienia związane z funkcjami matematycznymi",
  "display_order": 1,
  "created_at": "2025-10-13T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Section not found

---

#### List Topics in Section
**Method:** `GET`  
**Path:** `/api/sections/{sectionId}/topics`  
**Description:** Retrieve all topics within a section, ordered by display order.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "topics": [
    {
      "id": "uuid",
      "section_id": "uuid",
      "title": "Funkcje liniowe",
      "description": "Wprowadzenie do funkcji liniowych postaci y = ax + b",
      "display_order": 1,
      "created_at": "2025-10-13T10:00:00Z"
    },
    {
      "id": "uuid",
      "section_id": "uuid",
      "title": "Funkcje kwadratowe",
      "description": "Funkcje postaci y = ax² + bx + c",
      "display_order": 2,
      "created_at": "2025-10-13T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Section not found

---

#### Get Topic Details
**Method:** `GET`  
**Path:** `/api/topics/{topicId}`  
**Description:** Retrieve detailed information about a specific topic.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "id": "uuid",
  "section_id": "uuid",
  "title": "Funkcje liniowe",
  "description": "Wprowadzenie do funkcji liniowych postaci y = ax + b",
  "display_order": 1,
  "created_at": "2025-10-13T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Topic not found

---

#### Get Topic Dependencies
**Method:** `GET`  
**Path:** `/api/topics/{topicId}/dependencies`  
**Description:** Retrieve prerequisite topics that should be completed before this topic.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "topic_id": "uuid",
  "dependencies": [
    {
      "id": "uuid",
      "title": "Ułamki",
      "description": "Działania na ułamkach",
      "section_id": "uuid",
      "section_title": "Podstawy"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Topic not found

---

### 2.3 Learning Content

#### Get Learning Content for Topic
**Method:** `GET`  
**Path:** `/api/topics/{topicId}/content`  
**Description:** Retrieve all learning materials for a specific topic.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `usage_type` (optional): Filter by type (`explanation`, `exercise`, `diagnostic_question`)
- `is_verified` (optional): Filter by verification status (`true`/`false`)

**Success Response (200):**
```json
{
  "content": [
    {
      "id": "uuid",
      "topic_id": "uuid",
      "usage_type": "explanation",
      "content": {
        "text": "Funkcja liniowa to funkcja postaci f(x) = ax + b...",
        "examples": ["y = 2x + 3", "y = -x + 5"]
      },
      "is_verified": true,
      "created_at": "2025-10-13T10:00:00Z"
    },
    {
      "id": "uuid",
      "topic_id": "uuid",
      "usage_type": "exercise",
      "content": {
        "question": "Wyznacz współczynnik a dla funkcji przechodzącej przez punkty (0,1) i (2,5)",
        "correct_answer": "2",
        "explanation": "..."
      },
      "is_verified": true,
      "created_at": "2025-10-13T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Topic not found
- `400 Bad Request` - Invalid query parameters

---

### 2.4 Diagnostic Tests

#### Get Diagnostic Test for Section
**Method:** `GET`  
**Path:** `/api/sections/{sectionId}/diagnostic-test`  
**Description:** Retrieve the diagnostic test for a section including all questions.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "id": "uuid",
  "section_id": "uuid",
  "title": "Test diagnostyczny - Funkcje",
  "created_at": "2025-10-13T10:00:00Z",
  "questions": [
    {
      "id": "uuid",
      "content": {
        "question": "Co to jest funkcja?",
        "options": [
          "Przyporządkowanie każdemu x dokładnie jednego y",
          "Dowolna zależność między liczbami",
          "Wykres na płaszczyźnie",
          "Równanie matematyczne"
        ],
        "correct_answer_index": 0
      }
    },
    {
      "id": "uuid",
      "content": {
        "question": "Oblicz f(2) dla f(x) = 3x + 1",
        "type": "short_answer",
        "correct_answer": "7"
      }
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Section or diagnostic test not found

---

#### Create Diagnostic Test Attempt
**Method:** `POST`  
**Path:** `/api/diagnostic-test-attempts`  
**Description:** Begin a new diagnostic test attempt.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "diagnostic_test_id": "uuid"
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "diagnostic_test_id": "uuid",
  "score": 0,
  "completed_at": "2025-10-13T11:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Diagnostic test not found
- `400 Bad Request` - Invalid request body

---

#### Submit Answer to Diagnostic Test
**Method:** `POST`  
**Path:** `/api/user-answers`  
**Description:** Submit an answer to a question in a diagnostic test attempt.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "attempt_id": "uuid",
  "content_id": "uuid",
  "answer_content": {
    "selected_option_index": 0
  }
}
```

Or for short answer:
```json
{
  "attempt_id": "uuid",
  "content_id": "uuid",
  "answer_content": {
    "answer": "7"
  }
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "attempt_id": "uuid",
  "content_id": "uuid",
  "answer_content": {
    "selected_option_index": 0
  },
  "is_correct": true
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Attempt or content not found
- `400 Bad Request` - Invalid answer format
- `403 Forbidden` - Attempt belongs to another user

---

#### Complete Diagnostic Test Attempt
**Method:** `PUT`  
**Path:** `/api/diagnostic-test-attempts/{attemptId}/complete`  
**Description:** Finalize a diagnostic test attempt and calculate the score.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "diagnostic_test_id": "uuid",
  "score": 0.8,
  "completed_at": "2025-10-13T11:15:00Z",
  "answers": [
    {
      "content_id": "uuid",
      "is_correct": true
    },
    {
      "content_id": "uuid",
      "is_correct": true
    },
    {
      "content_id": "uuid",
      "is_correct": false
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Attempt not found
- `403 Forbidden` - Attempt belongs to another user
- `400 Bad Request` - Not all questions answered

**Validation:**
- Score must be between 0 and 1

---

### 2.5 Learning Sessions

#### Create Learning Session
**Method:** `POST`  
**Path:** `/api/sessions`  
**Description:** Start a new learning session for a specific topic.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "topic_id": "uuid"
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "topic_id": "uuid",
  "started_at": "2025-10-13T12:00:00Z",
  "ended_at": null,
  "ai_summary": null
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Topic not found
- `400 Bad Request` - Invalid request body

---

#### Get Session Details
**Method:** `GET`  
**Path:** `/api/sessions/{sessionId}`  
**Description:** Retrieve details about a specific learning session.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "topic_id": "uuid",
  "topic_title": "Funkcje liniowe",
  "started_at": "2025-10-13T12:00:00Z",
  "ended_at": "2025-10-13T12:45:00Z",
  "ai_summary": "Student successfully understood linear functions and solved 3 exercises."
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found
- `403 Forbidden` - Session belongs to another user

---

#### Add Message to Session
**Method:** `POST`  
**Path:** `/api/sessions/{sessionId}/messages`  
**Description:** Add a message (user or AI) to the session transcript.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "sender": "user",
  "content": {
    "type": "text",
    "text": "Jak obliczyć miejsce zerowe funkcji liniowej?"
  }
}
```

Or for AI response:
```json
{
  "sender": "ai",
  "content": {
    "type": "text",
    "text": "Miejsce zerowe funkcji liniowej znajdujemy przyrównując y do zera...",
    "audio_url": "https://storage.example.com/audio/..."
  }
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "sender": "user",
  "content": {
    "type": "text",
    "text": "Jak obliczyć miejsce zerowe funkcji liniowej?"
  },
  "created_at": "2025-10-13T12:05:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found
- `403 Forbidden` - Session belongs to another user
- `400 Bad Request` - Invalid sender or content format

**Validation:**
- `sender`: must be 'user' or 'ai'
- `content`: must be valid JSONB

---

#### Get Session Messages
**Method:** `GET`  
**Path:** `/api/sessions/{sessionId}/messages`  
**Description:** Retrieve all messages from a session transcript.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `limit` (optional, default: 50): Maximum number of messages to return
- `offset` (optional, default: 0): Number of messages to skip
- `order` (optional, default: 'asc'): Sort order ('asc' or 'desc')

**Success Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "sender": "user",
      "content": {
        "type": "text",
        "text": "Witaj, chcę uczyć się funkcji liniowych"
      },
      "created_at": "2025-10-13T12:00:00Z"
    },
    {
      "id": "uuid",
      "session_id": "uuid",
      "sender": "ai",
      "content": {
        "type": "text",
        "text": "Świetnie! Zacznijmy od podstaw...",
        "audio_url": "https://storage.example.com/audio/..."
      },
      "created_at": "2025-10-13T12:00:30Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found
- `403 Forbidden` - Session belongs to another user
- `400 Bad Request` - Invalid query parameters

---

#### End Learning Session
**Method:** `PUT`  
**Path:** `/api/sessions/{sessionId}/end`  
**Description:** Mark a session as ended and optionally add AI-generated summary.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "ai_summary": "Student successfully understood linear functions. Completed 3 exercises with 2 correct answers. Identified gap in understanding fractions, recommended review topic."
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "topic_id": "uuid",
  "started_at": "2025-10-13T12:00:00Z",
  "ended_at": "2025-10-13T12:45:00Z",
  "ai_summary": "Student successfully understood linear functions. Completed 3 exercises with 2 correct answers. Identified gap in understanding fractions, recommended review topic."
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found
- `403 Forbidden` - Session belongs to another user
- `400 Bad Request` - Session already ended

---

#### List User Sessions
**Method:** `GET`  
**Path:** `/api/sessions`  
**Description:** Retrieve all sessions for the authenticated user.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `topic_id` (optional): Filter by topic
- `limit` (optional, default: 20): Maximum number of sessions to return
- `offset` (optional, default: 0): Number of sessions to skip
- `include_ended` (optional, default: true): Include ended sessions

**Success Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "topic_id": "uuid",
      "topic_title": "Funkcje liniowe",
      "started_at": "2025-10-13T12:00:00Z",
      "ended_at": "2025-10-13T12:45:00Z",
      "ai_summary": "Student successfully understood linear functions..."
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "topic_id": "uuid",
      "topic_title": "Funkcje kwadratowe",
      "started_at": "2025-10-13T14:00:00Z",
      "ended_at": null,
      "ai_summary": null
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid query parameters

---

### 2.6 User Progress

#### Get User Progress Overview
**Method:** `GET`  
**Path:** `/api/user-progress`  
**Description:** Retrieve the user's progress across all topics.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `section_id` (optional): Filter by section
- `status` (optional): Filter by status ('not_started', 'in_progress', 'completed')

**Success Response (200):**
```json
{
  "progress": [
    {
      "user_id": "uuid",
      "section_id": "uuid",
      "section_title": "Funkcje",
      "topic_id": "uuid",
      "topic_title": "Funkcje liniowe",
      "status": "completed",
      "score": 0.9,
      "updated_at": "2025-10-13T12:45:00Z"
    },
    {
      "user_id": "uuid",
      "section_id": "uuid",
      "section_title": "Funkcje",
      "topic_id": "uuid",
      "topic_title": "Funkcje kwadratowe",
      "status": "in_progress",
      "score": 0.6,
      "updated_at": "2025-10-13T14:30:00Z"
    },
    {
      "user_id": "uuid",
      "section_id": "uuid",
      "section_title": "Geometria",
      "topic_id": "uuid",
      "topic_title": "Trójkąty",
      "status": "not_started",
      "score": null,
      "updated_at": null
    }
  ],
  "summary": {
    "total_topics": 45,
    "completed": 12,
    "in_progress": 3,
    "not_started": 30
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid query parameters

---

#### Get Progress for Specific Topic
**Method:** `GET`  
**Path:** `/api/user-progress/{topicId}`  
**Description:** Retrieve the user's progress for a specific topic.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "user_id": "uuid",
  "topic_id": "uuid",
  "topic_title": "Funkcje liniowe",
  "status": "completed",
  "score": 0.9,
  "updated_at": "2025-10-13T12:45:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Topic not found or no progress recorded

---

#### Update User Progress for Topic
**Method:** `PUT`  
**Path:** `/api/user-progress/{topicId}`  
**Description:** Update the user's progress for a specific topic.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "status": "completed",
  "score": 0.85
}
```

**Success Response (200):**
```json
{
  "user_id": "uuid",
  "topic_id": "uuid",
  "status": "completed",
  "score": 0.85,
  "updated_at": "2025-10-13T15:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Topic not found
- `400 Bad Request` - Invalid status or score value

**Validation:**
- `status`: must be 'not_started', 'in_progress', or 'completed'
- `score`: must be between 0 and 1 (if provided)

---

#### Get Section Progress Summary
**Method:** `GET`  
**Path:** `/api/sections/{sectionId}/progress`  
**Description:** Get aggregated progress for all topics in a section.

**Authentication:** Required (JWT Bearer token)

**Success Response (200):**
```json
{
  "section_id": "uuid",
  "section_title": "Funkcje",
  "topics": [
    {
      "topic_id": "uuid",
      "topic_title": "Funkcje liniowe",
      "status": "completed",
      "score": 0.9
    },
    {
      "topic_id": "uuid",
      "topic_title": "Funkcje kwadratowe",
      "status": "in_progress",
      "score": 0.6
    }
  ],
  "summary": {
    "total_topics": 8,
    "completed": 3,
    "in_progress": 2,
    "not_started": 3,
    "average_score": 0.75
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Section not found

---

## 3. Authentication and Authorization

### Authentication Mechanism

The API uses **Supabase Authentication** with JWT (JSON Web Tokens) for authentication.

#### Implementation Details:

1. **User Registration & Login**: Handled by Supabase Auth endpoints
   - Sign up: `POST /auth/v1/signup`
   - Sign in: `POST /auth/v1/token?grant_type=password`
   - Refresh token: `POST /auth/v1/token?grant_type=refresh_token`

2. **JWT Token**: 
   - Included in request headers as: `Authorization: Bearer {access_token}`
   - Token contains user ID (`sub` claim) used for authorization
   - Tokens expire after 1 hour (default Supabase setting)

3. **Profile Creation**:
   - Automatic via database trigger when user signs up
   - Trigger function: `handle_new_user()`
   - Extracts `login` from `raw_user_meta_data` and `email` from auth.users

### Authorization Strategy

Authorization is enforced at two levels:

#### 1. Row Level Security (RLS) - Database Level

All user-specific tables have RLS policies enabled:

```sql
-- Example: profiles table
CREATE POLICY "Allow users to manage their own profile"
ON profiles FOR ALL
USING (auth.uid() = id);
```

Tables with RLS:
- `profiles`
- `diagnostic_test_attempts`
- `user_answers`
- `sessions`
- `session_messages`
- `user_progress`

**Benefit**: Security enforced at database level, even if application code has bugs.

#### 2. API Level - Application Logic

For API endpoints:
- Extract user ID from JWT token (`auth.uid()`)
- Supabase client automatically applies RLS policies
- Additional business logic checks in API handlers

### Public vs Protected Resources

**Public Resources** (no authentication required):
- None in MVP (all users must be authenticated)

**Protected Resources** (authentication required):
- All API endpoints require valid JWT token

**Authorization Patterns**:

1. **Own Profile**: User can only access their own profile
   ```
   GET /api/profile → Returns profile where id = auth.uid()
   ```

2. **Knowledge Graph**: All authenticated users can read sections/topics
   ```
   GET /api/sections → Public knowledge structure
   ```

3. **User-Specific Data**: RLS ensures users only see their own data
   ```
   GET /api/sessions → Returns sessions where user_id = auth.uid()
   GET /api/user-progress → Returns progress where user_id = auth.uid()
   ```

4. **Nested Resources**: Authorization checked through parent resource
   ```
   POST /api/sessions/{sessionId}/messages
   → Session must belong to auth.uid()
   ```

### Security Best Practices

1. **HTTPS Only**: All API calls must use HTTPS in production
2. **Token Storage**: 
   - Store access tokens in memory (not localStorage for XSS protection)
   - Store refresh tokens in httpOnly cookies
3. **CORS**: Configure CORS to allow only frontend domain
4. **Rate Limiting**: Implement rate limiting (see Section 5)
5. **Input Validation**: Validate all inputs before processing
6. **SQL Injection Protection**: Use parameterized queries (Supabase handles this)

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Profiles
- `login`: 
  - Type: string
  - Min length: 3 characters
  - Unique across all profiles
  - Validation: `CHECK (char_length(login) >= 3)`
- `email`:
  - Type: string
  - Format: valid email address
  - Unique across all profiles
  - Required
- `has_completed_tutorial`:
  - Type: boolean
  - Default: false

#### Sections
- `title`:
  - Type: string
  - Required
  - Non-empty
- `display_order`:
  - Type: integer
  - Required
  - Used for ordering in UI

#### Topics
- `title`:
  - Type: string
  - Required
  - Non-empty
- `section_id`:
  - Type: UUID
  - Required
  - Must reference existing section
- `display_order`:
  - Type: integer
  - Required
  - Unique within section

#### Learning Content
- `topic_id`:
  - Type: UUID
  - Must reference existing topic
- `usage_type`:
  - Type: ENUM
  - Values: 'explanation', 'exercise', 'diagnostic_question'
  - Required
- `content`:
  - Type: JSONB
  - Required
  - Structure varies by usage_type:
    - **explanation**: `{ text: string, examples?: string[], images?: string[] }`
    - **exercise**: `{ question: string, correct_answer: string, explanation: string, hints?: string[] }`
    - **diagnostic_question**: `{ question: string, options?: string[], correct_answer: string | number, type: 'multiple_choice' | 'short_answer' }`
- `is_verified`:
  - Type: boolean
  - Default: false
  - Only verified content shown to students

#### Diagnostic Test Attempts
- `diagnostic_test_id`:
  - Type: UUID
  - Required
  - Must reference existing diagnostic test
- `score`:
  - Type: float
  - Range: 0.0 to 1.0
  - Validation: `CHECK (score >= 0 AND score <= 1)`
  - Calculated automatically from user_answers

#### User Answers
- `attempt_id`:
  - Type: UUID
  - Required
  - Must reference existing attempt belonging to current user
- `content_id`:
  - Type: UUID
  - Required
  - Must reference learning_content with usage_type = 'diagnostic_question'
- `answer_content`:
  - Type: JSONB
  - Required
  - Structure: `{ selected_option_index?: number, answer?: string }`
- `is_correct`:
  - Type: boolean
  - Calculated by comparing with correct_answer from learning_content

#### Sessions
- `topic_id`:
  - Type: UUID
  - Optional (can be null for general sessions)
  - Must reference existing topic if provided
- `ended_at`:
  - Type: timestamp
  - Must be after started_at if provided
- `ai_summary`:
  - Type: text
  - Optional
  - Generated by AI at session end

#### Session Messages
- `session_id`:
  - Type: UUID
  - Required
  - Must reference existing session belonging to current user
- `sender`:
  - Type: ENUM
  - Values: 'user', 'ai'
  - Required
- `content`:
  - Type: JSONB
  - Required
  - Flexible structure to support text, audio URLs, formulas, visualizations

#### User Progress
- `topic_id`:
  - Type: UUID
  - Required
  - Must reference existing topic
- `status`:
  - Type: ENUM
  - Values: 'not_started', 'in_progress', 'completed'
  - Default: 'not_started'
  - Required
- `score`:
  - Type: float
  - Range: 0.0 to 1.0
  - Validation: `CHECK (score >= 0 AND score <= 1)`
  - Optional (null for not_started status)

### 4.2 Business Logic Implementation

#### Onboarding Flow
1. User signs up via Supabase Auth
2. Database trigger creates profile with `has_completed_tutorial = false`
3. Frontend checks profile and shows tutorial if needed
4. After tutorial completion, frontend calls `PUT /api/profile` to set flag to true

#### Diagnostic Test Flow
1. User selects section
2. Frontend calls `GET /api/sections/{id}/diagnostic-test` to fetch test
3. Frontend calls `POST /api/diagnostic-test-attempts` to create attempt
4. For each question:
   - Frontend calls `POST /api/user-answers` to submit answer
   - Backend validates answer and calculates `is_correct`
5. Frontend calls `PUT /api/diagnostic-test-attempts/{id}/complete`
6. Backend:
   - Verifies all questions answered
   - Calculates final score: `correct_count / total_questions`
   - Updates attempt with score
   - Returns results

#### Adaptive Learning - Topic Recommendation
**Business Rule**: AI can identify knowledge gaps and suggest prerequisite topics.

**Implementation**:
1. During session, AI detects incorrect answer pattern
2. AI queries `GET /api/topics/{currentTopicId}/dependencies`
3. For each dependency, AI queries `GET /api/user-progress/{dependencyId}`
4. If dependency status is 'not_started' or score < 0.7:
   - AI suggests review session
   - User accepts/declines
5. If accepted:
   - Create new session with `topic_id = dependency_id`
   - After review completion, return to original session

#### Progress Tracking
**Business Rule**: Progress updated after significant milestones.

**Update Triggers**:
1. **After Diagnostic Test**: 
   - If score >= 0.7 → Set all topics in section to 'in_progress'
   - If score < 0.4 → Suggest starting from basics
2. **After Session End**:
   - Backend or AI calls `PUT /api/user-progress/{topicId}`
   - Updates status and score based on session performance
3. **Manual Override**:
   - User can mark topics as completed manually (future feature)

#### Session Management
**Business Rule**: Only one active session per user at a time (soft rule).

**Implementation**:
1. Frontend can check for active sessions: `GET /api/sessions?include_ended=false`
2. If active session exists, offer to resume or end it
3. AI summary generated at session end:
   - Analyzes session_messages
   - Identifies strengths and weaknesses
   - Stores in `ai_summary` field

#### Content Verification
**Business Rule**: Only verified content should be shown to students in production.

**Implementation**:
1. Content creation (admin/teacher portal - future):
   - AI generates content with `is_verified = false`
   - Teacher reviews and sets `is_verified = true`
2. API filtering:
   - `GET /api/topics/{id}/content` defaults to `is_verified = true`
   - Admin endpoints can access unverified content (future)

#### Knowledge Graph Navigation
**Business Rule**: Topics should be completed in logical order based on dependencies.

**Implementation**:
1. Frontend displays topics with dependency status
2. Topics with incomplete dependencies shown as "locked" or "recommended after X"
3. User can still access any topic (no hard blocking in MVP)
4. AI can suggest optimal learning path based on:
   - Diagnostic test results
   - Current progress
   - Topic dependencies

---

## 5. Additional Considerations

### 5.1 Error Handling Standards

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "The provided email address is invalid",
    "details": {
      "field": "email",
      "constraint": "valid_email_format"
    }
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - User lacks permission for this resource
- `NOT_FOUND` - Requested resource doesn't exist
- `INVALID_INPUT` - Validation error on request data
- `CONSTRAINT_VIOLATION` - Database constraint violated
- `INTERNAL_ERROR` - Unexpected server error

### 5.2 Rate Limiting

**Strategy**: Implement rate limiting to prevent abuse.

**Limits** (per user):
- Authentication endpoints: 5 requests per minute
- Session message creation: 60 requests per minute (1 per second)
- General API endpoints: 100 requests per minute

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1697198400
```

**Rate Limit Exceeded Response (429)**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 23 seconds.",
    "retry_after": 23
  }
}
```

### 5.3 Pagination Standards

For list endpoints, use cursor-based or offset-based pagination:

**Query Parameters**:
- `limit`: Number of items to return (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
```

### 5.4 Filtering and Sorting

**Filtering**: Use query parameters
```
GET /api/user-progress?status=completed&section_id=uuid
```

**Sorting**: Use `sort` parameter
```
GET /api/sessions?sort=-started_at  // descending
GET /api/sessions?sort=started_at   // ascending
```

### 5.5 CORS Configuration

**Allowed Origins**:
- Development: `http://localhost:4321`
- Production: `https://aitutor.example.com`

**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers**: Authorization, Content-Type

**Credentials**: true (for cookie-based refresh tokens)

### 5.6 API Versioning

**Strategy**: URL-based versioning

**Current Version**: v1 (implicit, no version in URL for MVP)

**Future Versioning**:
```
/api/v2/sessions
```

**Deprecation Policy**:
- At least 6 months notice before deprecating endpoints
- Clear migration guides provided

### 5.7 Webhooks (Future)

For real-time features, consider WebSocket connections:

**Endpoint**: `wss://api.aitutor.example.com/ws`

**Use Cases**:
- Real-time AI response streaming
- Live session updates
- Progress notifications

### 5.8 Analytics and Logging

**Logged Data** (anonymized for analysis):
- API endpoint usage
- Response times
- Error rates
- Session durations
- Popular topics

**Privacy**: User IDs anonymized before export for analytics.

### 5.9 Caching Strategy

**Cacheable Resources**:
- Sections: Cache for 1 hour (infrequently changed)
- Topics: Cache for 1 hour
- Learning Content: Cache for 30 minutes
- User Progress: No caching (frequently updated)
- Sessions: No caching (real-time data)

**Cache Headers**:
```
Cache-Control: public, max-age=3600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

### 5.10 Health Check Endpoint

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-10-13T15:30:00Z",
  "services": {
    "database": "healthy",
    "supabase_auth": "healthy"
  }
}
```

---

## 6. Implementation Roadmap

### Phase 1: Core Authentication & Profile (Week 1)
- [ ] Supabase Auth integration
- [ ] Profile CRUD endpoints
- [ ] Database trigger for profile creation
- [ ] RLS policies for profiles

### Phase 2: Knowledge Structure (Week 1-2)
- [ ] Sections endpoints
- [ ] Topics endpoints
- [ ] Topic dependencies endpoint
- [ ] Learning content endpoints

### Phase 3: Diagnostic Tests (Week 2-3)
- [ ] Diagnostic test retrieval
- [ ] Test attempt creation
- [ ] Answer submission
- [ ] Test completion and scoring

### Phase 4: Learning Sessions (Week 3-4)
- [ ] Session CRUD operations
- [ ] Session messages endpoints
- [ ] Real-time message streaming (optional)
- [ ] Session summary generation

### Phase 5: Progress Tracking (Week 4)
- [ ] User progress endpoints
- [ ] Progress calculation logic
- [ ] Section progress summary
- [ ] Integration with sessions/tests

### Phase 6: Polish & Testing (Week 5)
- [ ] Error handling standardization
- [ ] Rate limiting implementation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Integration tests
- [ ] Load testing

---

## 7. OpenAPI Specification Notes

A complete OpenAPI 3.0 specification should be generated and hosted at:
- Development: `http://localhost:4321/api/docs`
- Production: `https://aitutor.example.com/api/docs`

This will provide:
- Interactive API documentation (Swagger UI)
- Request/response examples
- Authentication flow testing
- Code generation for clients

---

## 8. Future Enhancements

### Post-MVP Features:
1. **Admin Portal API**:
   - Content management endpoints
   - User management
   - Analytics dashboards

2. **Advanced AI Features**:
   - Visualization generation endpoints
   - Proactive hint system
   - Voice-to-formula conversion

3. **Social Features**:
   - Study groups
   - Peer comparison (anonymized)
   - Achievement system

4. **Mobile API Optimization**:
   - Batch request endpoints
   - Offline sync capabilities
   - Binary protocol for voice data

5. **Payment Integration**:
   - Subscription management
   - Usage tracking
   - Billing endpoints

