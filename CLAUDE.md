# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Tutor Matematyki (AI Math Tutor) is an intelligent educational web application providing personalized mathematics tutoring for Polish high school students preparing for the basic-level matriculation exam (matura podstawowa). The application combines voice conversation with AI, mathematical visualizations, and an adaptive learning system.

**Key Value Propositions:**
- 24/7 AI math tutor with voice conversation
- 2-3x cheaper than traditional tutoring (79-99 PLN/month)
- Personalized learning paths with automatic adaptation to student level
- Real-time mathematical visualizations and step-by-step guidance

## Tech Stack

### Core Technologies
- **Astro 5.13.7** - Server-side rendered framework with partial hydration
- **React 19** - Interactive UI components
- **TypeScript 5** - Full type safety
- **Tailwind CSS 4** - Utility-first styling via Vite plugin
- **Supabase** - PostgreSQL database, authentication, RLS policies
- **Shadcn/ui** - Radix UI-based component library

### Build Configuration
- **Runtime:** Node.js 22.14.0 (use nvm)
- **Adapter:** @astrojs/node (standalone mode)
- **Dev Server:** Port 3000
- **Output:** Server-side rendering (`output: "server"`)

## Development Commands

### Essential Commands
```bash
# Development
npm run dev              # Start dev server on port 3000

# Build & Preview
npm run build            # Production build
npm run preview          # Preview built application

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format with Prettier

# Database (Supabase CLI)
supabase start           # Start local Supabase
supabase db reset        # Reset and apply migrations
supabase migration new   # Create new migration
```

### Git Hooks
- Pre-commit: ESLint on `*.{ts,tsx,astro}`, Prettier on `*.{json,css,md}`
- Configured via Husky and lint-staged

## Architecture Overview

### High-Level Architecture

This is a **full-stack SSR application** with three-tier architecture:

```
┌─────────────────────────────────────────────────────┐
│  Astro Pages (.astro files)                         │
│  - Server-side rendering                            │
│  - Static layouts + React islands                   │
│  - Access to context.locals.supabase                │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  API Routes (src/pages/api/*.ts)                    │
│  - RESTful endpoints                                │
│  - Zod validation                                   │
│  - Service layer calls                              │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Services (src/lib/services/*.ts)                   │
│  - Business logic                                   │
│  - Supabase interactions                            │
│  - Error handling with Polish localization          │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Auth)                       │
│  - RLS policies for security                        │
│  - Database triggers                                │
│  - Auto-generated TypeScript types                  │
└─────────────────────────────────────────────────────┘
```

### Project Structure

```
src/
├── pages/                      # File-based routing
│   ├── index.astro            # Landing page
│   ├── auth/                  # Authentication pages
│   │   ├── login.astro
│   │   ├── register.astro
│   │   └── *.astro
│   ├── app/                   # Protected application pages
│   │   └── profile.astro
│   └── api/                   # API endpoints (prerender=false)
│       ├── auth/
│       │   ├── login.ts       # POST /api/auth/login
│       │   └── register.ts    # POST /api/auth/register
│       └── profile.ts         # GET /api/profile
├── layouts/
│   └── Layout.astro           # Root HTML layout
├── components/
│   ├── auth/                  # Authentication React components
│   ├── profile/               # Profile management components
│   ├── common/                # Shared UI (LoadingState, ErrorState)
│   └── ui/                    # Shadcn/ui components
├── lib/
│   ├── services/              # Business logic layer
│   │   ├── auth.service.ts
│   │   └── profile.service.ts
│   ├── api/                   # Client-side API callers
│   │   └── profile.client.ts
│   ├── types/                 # UI-specific types
│   └── utils/                 # Utilities
│       ├── api-response.ts    # Standardized API responses
│       └── utils.ts           # cn() helper
├── hooks/                     # React custom hooks
│   ├── useProfile.ts
│   └── usePreferences.ts
├── db/
│   ├── supabase.client.ts     # Server-side client initialization
│   └── database.types.ts      # Auto-generated from Supabase
├── middleware/
│   └── index.ts               # Session management middleware
├── types.ts                   # Shared DTOs and entities
└── env.d.ts                   # Astro environment types

supabase/
└── migrations/                # Database migrations (YYYYMMDDHHmmss_description.sql)
```

## Key Architectural Patterns

### 1. Authentication & Session Management

**Middleware-Based Session Restoration** ([src/middleware/index.ts](src/middleware/index.ts)):
- Runs on every request before page rendering
- Reads `sb-access-token` and `sb-refresh-token` cookies
- Calls `supabase.auth.setSession()` to restore session
- Injects authenticated Supabase client into `context.locals.supabase`
- Updates cookies after response (7-day access token, 30-day refresh token)
- All cookies: httpOnly, secure in production, sameSite: lax

**Two Supabase Clients:**
1. **Server Client** ([src/db/supabase.client.ts](src/db/supabase.client.ts))
   - Uses service role key (elevated privileges)
   - Created per-request in middleware
   - Available as `Astro.locals.supabase` in pages/API routes

2. **Browser Client** ([src/lib/supabase-browser.ts](src/lib/supabase-browser.ts))
   - Uses public anon key
   - Function: `getSupabaseBrowserClient()`
   - For React components and client-side operations

**Authentication Flow:**
```typescript
// In API routes (server-side)
const { data, error } = await context.locals.supabase.auth.getSession();

// In React components (client-side)
const supabase = getSupabaseBrowserClient();
const { data } = await supabase.auth.getSession();
```

**Auth Service** ([src/lib/services/auth.service.ts](src/lib/services/auth.service.ts)):
- Singleton pattern with Polish error messages
- Methods: `signIn()`, `signUp()`, `signOut()`, `getSession()`
- On signup: Creates auth user + profile record via database trigger

### 2. Type Safety Strategy

**Three-Tier Type System:**

1. **Entity Types** (Database representation) - [src/types.ts](src/types.ts)
   ```typescript
   export interface ProfileEntity {
     id: string;
     login: string;
     email: string;
     has_completed_tutorial: boolean;
     created_at: string;
   }
   ```

2. **DTO Types** (API contracts) - [src/types.ts](src/types.ts)
   ```typescript
   export type ProfileDTO = ProfileEntity;
   export interface LoginRequest { email: string; password: string; }
   export interface LoginResponse { user: ProfileDTO; session: Session; }
   ```

3. **ViewModel Types** (UI representation) - [src/lib/types/profile-view.types.ts](src/lib/types/profile-view.types.ts)
   ```typescript
   export interface ProfileViewModel {
     id: string;
     login: string;
     email: string;
     hasCompletedTutorial: boolean;  // camelCase for UI
     createdAtIso: string;
   }
   ```

**Data Flow:**
```
Database (snake_case) → ProfileEntity → ProfileDTO → ProfileViewModel (camelCase)
```

**Type Guards** ([src/types.ts](src/types.ts)):
- Runtime type checking: `isMultipleChoiceAnswer()`, `isTextMessageContent()`

### 3. API Route Pattern

All API routes follow this structure ([src/pages/api/auth/login.ts](src/pages/api/auth/login.ts)):

```typescript
export const prerender = false;  // Required for API routes

export const POST: APIRoute = async (context) => {
  try {
    // 1. Parse & validate input with Zod
    const loginRequest = LoginRequestSchema.parse(await context.request.json());

    // 2. Call service layer
    const { user, session } = await authService.signIn(
      context.locals.supabase,
      loginRequest.email,
      loginRequest.password
    );

    // 3. Set httpOnly cookies
    context.cookies.set('sb-access-token', session.access_token, { ... });

    // 4. Return standardized response
    return createSuccessResponse({ user, session });

  } catch (error) {
    // 5. Handle errors with Polish messages
    return ErrorResponses.badRequest(error.message);
  }
};
```

**API Response Utilities** ([src/lib/utils/api-response.ts](src/lib/utils/api-response.ts)):
```typescript
createSuccessResponse<T>(data: T, status?: number): Response
createErrorResponse(code: string, message: string, status: number): Response

ErrorResponses.badRequest(message, details)   // 400
ErrorResponses.unauthorized()                 // 401
ErrorResponses.notFound()                     // 404
ErrorResponses.internalError(message)         // 500
```

### 4. React Component Patterns

**Server Pages with React Islands:**
```astro
---
// src/pages/app/profile.astro
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (!session) return Astro.redirect('/auth/login');
---

<Layout title="Profile">
  <ProfileScreen client:load />  <!-- React island -->
</Layout>
```

**Custom Hooks for Data Fetching** ([src/hooks/useProfile.ts](src/hooks/useProfile.ts)):
```typescript
export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    data: undefined,
    loading: true,
    error: undefined,
    canRetry: false
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (retryCount = 0) => {
    try {
      const profile = await fetchProfile();
      setState({ data: profile, loading: false, canRetry: false });
    } catch (error) {
      // Retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
        return loadProfile(retryCount + 1);
      }
      setState({ loading: false, error, canRetry: true });
    }
  };

  return { ...state, refetch: () => loadProfile() };
}
```

**Preferences Hook with localStorage** ([src/hooks/usePreferences.ts](src/hooks/usePreferences.ts)):
- Persists theme and audio settings
- Applies theme to `document.documentElement.classList`
- Syncs with OS theme preference via `window.matchMedia()`
- SSR-safe (guards against undefined window/document)

### 5. Database Patterns

**Row Level Security (RLS):**
Every table has RLS enabled. Three policy categories:

1. **Reference Data** (sections, topics, learning_content, diagnostic_tests)
   - SELECT: Open to all (anon + authenticated)
   - INSERT/UPDATE/DELETE: Denied

2. **User-Owned Data** (profiles, user_progress, sessions, diagnostic_test_attempts)
   - All operations: `auth.uid() = user_id`
   - Anonymous users: Denied

3. **Related Data** (user_answers, session_messages)
   - Access via JOIN ownership checks

**Database Trigger for User Creation:**
```sql
-- Auto-creates profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Migration Naming Convention:**
```
YYYYMMDDHHmmss_short_description.sql
Example: 20251016000000_create_core_learning_schema.sql
```

Use current UTC timestamp for new migrations.

**Type Generation:**
```bash
# After creating/modifying migrations
supabase db reset
# Types auto-generated in src/db/database.types.ts
```

### 6. Error Handling

**Service Layer Errors (Polish localization):**
```typescript
// src/lib/services/auth.service.ts
private translateSupabaseError(error: AuthError): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Nieprawidłowy email lub hasło',
    'Email not confirmed': 'Email nie został potwierdzony',
    'User already registered': 'Użytkownik już istnieje',
  };
  return errorMap[error.message] || 'Wystąpił błąd podczas logowania';
}
```

**API Error Responses:**
```typescript
// Consistent error format
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Email jest wymagany',
    details?: { field: 'email', issue: 'invalid_format' }
  }
}
```

**Client-Side Error Display:**
- `ErrorState` component shows user-friendly messages
- Retry mechanisms in hooks (max 3 attempts with delays)
- Loading states via `LoadingState` component

## Important Development Rules

### Astro-Specific Guidelines
- **Use `export const prerender = false`** for all API routes
- **Leverage `context.locals.supabase`** in API routes, not `supabaseClient` import
- **Use uppercase HTTP methods:** `export const POST: APIRoute` not `export const post`
- Extract logic into services in `src/lib/services/`, keep routes thin
- Use Zod for input validation in all API endpoints
- Access environment variables via `import.meta.env`

### React Component Guidelines
- **Use Astro components** for static content and layout
- **Use React components** only when interactivity is needed
- Mark React components with `client:load` or `client:idle` in Astro files
- Polish language for all user-facing text
- Accessibility: Use ARIA landmarks, semantic HTML, keyboard navigation

### Styling Guidelines
- Use Tailwind utility classes exclusively (no custom CSS files)
- Use `cn()` utility from `src/lib/utils.ts` to merge classes
- Shadcn/ui components use Class Variance Authority (CVA)
- Dark mode: `dark:` variant (managed by `usePreferences` hook)
- Responsive: `sm:`, `md:`, `lg:` variants

### Backend & Database Guidelines
- **Always use the SupabaseClient type** from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- **RLS policies required** on all tables, even public ones
- **Granular RLS policies:** One policy per operation (select/insert/update/delete) per role (anon/authenticated)
- **Migration headers:** Include purpose, affected tables, special considerations
- Write SQL in lowercase with copious comments
- Use Zod schemas to validate all data exchanged with backend

### Type Safety Guidelines
- **Follow three-tier type system:** Entity → DTO → ViewModel
- **Database types:** Auto-generated in `src/db/database.types.ts` (never edit manually)
- **Shared types:** Define in `src/types.ts` (DTOs, entities, API contracts)
- **UI types:** Define in `src/lib/types/` (ViewModels, component state)
- Use type guards for runtime validation of polymorphic data

### Code Quality Guidelines
- Handle errors and edge cases at the beginning of functions
- Use early returns to avoid nested conditionals
- Place happy path last for readability
- Avoid unnecessary else statements
- Implement proper error logging and user-friendly messages
- Use guard clauses for preconditions

## Environment Variables

```env
# Server-side (private)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<service_role_key>

# Client-side (public - exposed to browser)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<anon_key>

# AI Integration
OPENROUTER_API_KEY=<your_key>
```

**Important:** Variables prefixed with `PUBLIC_` are exposed to the browser. Keep service keys private.

## Testing Strategy

### Current State
- No test framework configured yet
- Manual testing via local Supabase instance

### Planned Testing (Post-MVP)
- Unit tests: Vitest for services and utilities
- Integration tests: Playwright for API endpoints
- E2E tests: Playwright for authentication flows
- Component tests: React Testing Library

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User public profile | id, login, email, has_completed_tutorial |
| `sections` | Subject areas (e.g., Algebra) | id, title, display_order |
| `topics` | Concepts within sections | id, section_id, title |
| `learning_content` | Educational materials | id, topic_id, usage_type, content (JSONB) |
| `diagnostic_tests` | Assessment tests | id, section_id, title |
| `diagnostic_test_attempts` | User test attempts | id, user_id, test_id, score |
| `sessions` | Learning sessions | id, user_id, topic_id, ai_summary |
| `session_messages` | Session transcript | id, session_id, sender, content (JSONB) |
| `user_progress` | Topic mastery tracking | user_id, topic_id, status, score |

### Key Views
- `vw_user_skill_map` - Complete skill tree with user progress
- `vw_session_details` - Enriched session data with user/topic info

## Common Workflows

### Adding a New API Endpoint
1. Create file in `src/pages/api/` (e.g., `src/pages/api/foo.ts`)
2. Add `export const prerender = false`
3. Define Zod schema for request validation
4. Create service method in `src/lib/services/`
5. Implement API route handler with error handling
6. Add types to `src/types.ts`
7. Test via local Supabase

### Adding a New Database Table
1. Create migration: `supabase migration new create_table_name`
2. Write SQL with header comment, lowercase, RLS policies
3. Apply: `supabase db reset`
4. Verify types generated in `src/db/database.types.ts`
5. Add entity/DTO types to `src/types.ts`
6. Create service methods if needed

### Adding a New React Component
1. Create in appropriate directory (`components/auth/`, `components/profile/`)
2. Use TypeScript with proper prop types
3. Import UI components from `components/ui/`
4. Use `cn()` for class merging
5. Polish language for all text
6. Add ARIA attributes for accessibility
7. Use in Astro page with `client:load` directive

### Working with Supabase Types
```typescript
// Server-side (in API routes or services)
import type { SupabaseClient } from '@/db/supabase.client';

async function someFunction(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();
}

// Client-side (in React components)
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

const supabase = getSupabaseBrowserClient();
const { data } = await supabase.from('profiles').select('*');
```

## Project Status & Roadmap

**Current Status:** MVP Development (Draft)
**Version:** 0.0.1

### MVP Features (In Progress)
- ✅ User authentication (email/password)
- ✅ Profile management
- ✅ Database schema for learning content
- ⏳ Voice conversation with AI tutor
- ⏳ Diagnostic test system
- ⏳ Mathematical visualizations
- ⏳ Active material guidance
- ⏳ Adaptive learning system

### Post-MVP Features
- Student dashboard with progress visualization
- Continuous voice mode with VAD
- Photo upload of solutions (OCR)
- Gamification (points, achievements)
- Native mobile apps

### Key Technical Decisions (TBD)
1. **Visualization Library:** Manim vs p5.js vs D3.js
2. **LLM Model:** GPT-4 vs Claude 3.5 Sonnet vs Bielik
3. **Caching Strategy:** Redis + semantic embeddings

## Additional Resources

- **Product Requirements:** [PRD.md](PRD.md) (if exists)
- **Supabase Documentation:** https://supabase.com/docs
- **Astro Documentation:** https://docs.astro.build
- **Shadcn/ui Components:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs
