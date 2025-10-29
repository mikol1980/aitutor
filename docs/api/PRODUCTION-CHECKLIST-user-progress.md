# Production Checklist: User Progress Endpoint

## Przygotowanie do wdrożenia produkcyjnego

Data: 2025-10-29
Status: ⚠️ WYMAGA UZUPEŁNIEŃ PRZED PRODUKCJĄ

---

## ✅ Zaimplementowane

- [x] Endpoint API z pełną walidacją
- [x] RLS policies dla bezpieczeństwa
- [x] Obsługa błędów z polskimi komunikatami
- [x] TypeScript type safety
- [x] Client-side API caller z mapowaniem DTO→ViewModel
- [x] React hook z retry mechanism
- [x] Przykładowy komponent UI
- [x] Dokumentacja API
- [x] Security review
- [x] Test scripts

---

## ⚠️ WYMAGANE przed produkcją

### 1. Rate Limiting ⚠️ KRYTYCZNE

**Problem:** Obecnie brak limitów zapytań - możliwy abuse/DoS

**Zalecana implementacja:**

#### Opcja A: Astro Middleware Rate Limiting

```typescript
// src/middleware/rate-limit.ts
import type { MiddlewareHandler } from 'astro';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuta
const MAX_REQUESTS_PER_WINDOW = 100; // 100 req/min

export const rateLimitMiddleware: MiddlewareHandler = async (context, next) => {
  // Skip rate limiting for non-API routes
  if (!context.url.pathname.startsWith('/api/')) {
    return next();
  }

  // Get user ID from session
  const { data: { user } } = await context.locals.supabase.auth.getUser();

  if (!user) {
    // For anonymous users, use IP (or skip rate limiting)
    return next();
  }

  const key = `rate-limit:${user.id}`;
  const now = Date.now();
  const userLimit = rateLimitStore.get(key);

  if (!userLimit || now > userLimit.resetAt) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return next();
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    return new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.',
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((userLimit.resetAt - now) / 1000)),
        },
      }
    );
  }

  // Increment counter
  userLimit.count++;
  rateLimitStore.set(key, userLimit);

  return next();
};
```

**Integracja w middleware/index.ts:**

```typescript
import { sequence } from 'astro:middleware';
import { authMiddleware } from './auth';
import { rateLimitMiddleware } from './rate-limit';

export const onRequest = sequence(authMiddleware, rateLimitMiddleware);
```

#### Opcja B: Redis-based Rate Limiting (preferowana dla produkcji)

```bash
npm install ioredis @upstash/ratelimit
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});
```

**Użycie w endpointach:**

```typescript
// src/pages/api/user-progress/index.ts
import { ratelimit } from '@/lib/rate-limit';

export const GET: APIRoute = async ({ locals, request }) => {
  // Get user ID
  const { data: { user } } = await locals.supabase.auth.getUser();

  if (!user) {
    return ErrorResponses.unauthorized();
  }

  // Check rate limit
  const { success, reset } = await ratelimit.limit(user.id);

  if (!success) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.',
        },
      }),
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  // ... rest of endpoint logic
};
```

**Konfiguracja .env:**

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

### 2. Pagination ⚠️ ZALECANE

**Problem:** Przy dużej liczbie tematów (500+) response może być zbyt duży

**Zalecana implementacja:**

#### Backend: Dodanie paginacji do endpointu

```typescript
// src/pages/api/user-progress/index.ts

const QuerySchema = z.object({
  section_id: z.string().uuid().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),

  // Pagination parameters
  limit: z.coerce.number().int().min(1).max(500).default(100).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

// ... in handler
const { section_id, status, limit = 100, offset = 0 } = validationResult.data;

const { progress, summary, total } = await progressService.getUserProgressOverview(
  locals.supabase,
  { sectionId: section_id, status, limit, offset }
);

return createSuccessResponse({
  progress,
  summary,
  pagination: {
    total,
    limit,
    offset,
    has_more: offset + progress.length < total,
  },
});
```

#### Service: Implementacja paginacji w Supabase query

```typescript
// src/lib/services/progress.service.ts

async getUserProgressOverview(
  supabase: SupabaseClient<Database>,
  filters: {
    sectionId?: string;
    status?: UserProgressStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{
  progress: UserProgressWithDetailsDTO[];
  summary: UserProgressSummaryDTO;
  total: number;
}> {
  const { limit = 100, offset = 0 } = filters;

  // Build base query
  let query = supabase
    .from('user_progress')
    .select(`...`, { count: 'exact' }); // Enable count

  // Apply filters
  if (filters.sectionId) {
    query = query.eq('topics.section_id', filters.sectionId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  // ... rest of logic

  return {
    progress: mappedData,
    summary: calculateSummary(mappedData),
    total: count ?? 0,
  };
}
```

#### Frontend: Hook z paginacją

```typescript
// src/hooks/useUserProgress.ts

export function useUserProgress(initialFilters: ProgressFilters = {}) {
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  const loadMore = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  const reset = useCallback(() => {
    setOffset(0);
  }, []);

  // ... load with limit/offset

  return {
    // ... existing returns
    loadMore,
    reset,
    hasMore: data?.pagination?.has_more ?? false,
  };
}
```

---

### 3. Caching (opcjonalne, ale zalecane)

**Problem:** Częste zapytania o te same dane obciążają bazę

**Zalecana implementacja: Redis cache z TTL**

```typescript
// src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

const CACHE_TTL = 5 * 60; // 5 minut

export async function getCachedProgress(
  userId: string,
  filters: ProgressFilters
): Promise<UserProgressOverviewResponseDTO | null> {
  const key = `progress:${userId}:${JSON.stringify(filters)}`;
  return await redis.get(key);
}

export async function setCachedProgress(
  userId: string,
  filters: ProgressFilters,
  data: UserProgressOverviewResponseDTO
): Promise<void> {
  const key = `progress:${userId}:${JSON.stringify(filters)}`;
  await redis.setex(key, CACHE_TTL, JSON.stringify(data));
}

export async function invalidateProgressCache(userId: string): Promise<void> {
  const pattern = `progress:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**Użycie w endpoincie:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();

  // Try cache first
  const cached = await getCachedProgress(user.id, { section_id, status });
  if (cached) {
    console.info('Cache hit for user progress');
    return createSuccessResponse(cached);
  }

  // Fetch from database
  const { progress, summary } = await progressService.getUserProgressOverview(...);

  // Cache for next time
  await setCachedProgress(user.id, { section_id, status }, { progress, summary });

  return createSuccessResponse({ progress, summary });
};
```

**Cache invalidation przy aktualizacji:**

```typescript
// PUT /api/user-progress/{topicId}
export const PUT: APIRoute = async ({ params, locals, request }) => {
  // ... update progress

  // Invalidate cache
  await invalidateProgressCache(user.id);

  return createSuccessResponse(updatedProgress);
};
```

---

### 4. Monitoring i Alerty

**Zalecane narzędzia:**

- **Sentry** - Error tracking i performance monitoring
- **Upstash** - Redis analytics (wbudowane w @upstash/ratelimit)
- **Supabase Dashboard** - Query performance

**Konfiguracja Sentry:**

```bash
npm install @sentry/astro
```

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sentry from '@sentry/astro';

export default defineConfig({
  integrations: [
    sentry({
      dsn: import.meta.env.SENTRY_DSN,
      environment: import.meta.env.MODE,
    }),
  ],
});
```

**Alerty do ustawienia:**

1. Error rate > 5% przez 5 minut
2. Średni czas odpowiedzi > 1s przez 5 minut
3. Rate limit exceeded > 10 razy/minutę
4. Database connection errors

---

### 5. Database Optimization

**Sprawdź indeksy:**

```sql
-- Sprawdź plan zapytania
EXPLAIN ANALYZE
SELECT up.*, t.*, s.*
FROM user_progress up
INNER JOIN topics t ON up.topic_id = t.id
INNER JOIN sections s ON t.section_id = s.id
WHERE up.user_id = 'uuid-here';
```

**Zalecane indeksy (jeśli nie istnieją):**

```sql
-- Composite index dla filtrowania
CREATE INDEX IF NOT EXISTS idx_user_progress_user_status
  ON user_progress(user_id, status);

-- Index dla topic -> section join
CREATE INDEX IF NOT EXISTS idx_topics_section
  ON topics(section_id);
```

---

## 📋 Production Deployment Checklist

### Pre-deployment

- [ ] Rate limiting zaimplementowany i przetestowany
- [ ] Pagination dodany (jeśli > 100 tematów w bazie)
- [ ] Cache Redis skonfigurowany (opcjonalnie)
- [ ] Sentry zintegrowany
- [ ] Database indexes zoptymalizowane
- [ ] Load testing wykonany (100 concurrent users)
- [ ] Security review zaktualizowany

### Environment Variables

```env
# Production .env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_DSN=https://...
```

### Deployment

- [ ] Deploy to staging
- [ ] Smoke tests na staging
- [ ] Monitor Sentry for 24h on staging
- [ ] Deploy to production
- [ ] Monitor for 1h post-deployment

### Post-deployment Monitoring (first 7 days)

- [ ] Error rate < 1%
- [ ] P95 latency < 500ms
- [ ] Rate limit hits < 0.1% of requests
- [ ] No database connection errors
- [ ] Cache hit rate > 50% (if implemented)

---

## 🎯 Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Response time (P50) | < 200ms | < 500ms |
| Response time (P95) | < 500ms | < 1000ms |
| Error rate | < 0.5% | < 2% |
| Availability | > 99.9% | > 99% |
| Cache hit rate | > 60% | > 40% |

---

## 📞 Incident Response

**Jeśli endpoint ma problemy w produkcji:**

1. **Check Sentry** - Czy są nowe błędy?
2. **Check Supabase Dashboard** - Czy baza jest dostępna?
3. **Check rate limits** - Czy ktoś nie atakuje?
4. **Rollback** - W razie potrzeby przywróć poprzednią wersję
5. **Notify team** - Slack/email alert

**Kontakt:**
- DevOps: devops@example.com
- On-call: +48 XXX XXX XXX

---

**Status końcowy przed produkcją: ⚠️ WYMAGA RATE LIMITING**

Endpoint jest gotowy do użycia w środowisku deweloperskim, ale wymaga rate limiting przed wdrożeniem produkcyjnym.
