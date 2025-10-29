## API Endpoint Implementation Plan: Topic View (Topics Details, Dependencies, Content)

### 1. Przegląd punktu końcowego
Zestaw trzech punktów końcowych do wyświetlania widoku tematu (Topic View):
- Pobieranie szczegółów tematu.
- Pobieranie listy zależności (prerequisites) dla tematu.
- Pobieranie materiałów dydaktycznych przypisanych do tematu z opcjonalnymi filtrami.

Zgodność ze specyfikacją (wyciąg z `.ai/api-plan.md`):
- GET `/api/topics/{topicId}`
- GET `/api/topics/{topicId}/dependencies`
- GET `/api/topics/{topicId}/content?usage_type=&is_verified=`

Wymaga uwierzytelnienia (JWT Bearer). Dane sekcji/tematów/kontentu są publicznie odczytywalne na DB (RLS wyłączone), ale API pozostaje chronione na poziomie aplikacji.

### 2. Szczegóły żądania
- **Metody HTTP**: GET
- **Struktury URL**:
  - `/api/topics/{topicId}`
  - `/api/topics/{topicId}/dependencies`
  - `/api/topics/{topicId}/content`
- **Parametry**:
  - **Path params (wymagane)**:
    - `topicId: string (UUID)`
  - **Query params (opcjonalne, tylko dla content)**:
    - `usage_type: 'explanation' | 'exercise' | 'diagnostic_question'`
    - `is_verified: 'true' | 'false'` (parsowane do boolean)
- **Request Body**: brak (GET)
- **Nagłówki**:
  - `Authorization: Bearer <jwt>` (wymagane)

### 3. Wykorzystywane typy
Zgodnie z `src/types.ts`:
- DTO:
  - `TopicDTO`
  - `TopicDependenciesResponseDTO` + `TopicDependencyDTO`
  - `LearningContentListResponseDTO` + `LearningContentDTO`
  - `ApiErrorResponseDTO`
- Typy pomocnicze:
  - `ContentUsageType`
  - `PaginationDTO` (nie jest wymagane w tym MVP, brak paginacji w content)

### 4. Szczegóły odpowiedzi
- Sukces:
  - `GET /api/topics/{topicId}` → `200 TopicDTO`
  - `GET /api/topics/{topicId}/dependencies` → `200 TopicDependenciesResponseDTO`
  - `GET /api/topics/{topicId}/content` → `200 LearningContentListResponseDTO`
- Błędy (standaryzowane z `src/lib/utils/api-response.ts`):
  - `400 Bad Request` — nieprawidłowe parametry (UUID, query)
  - `401 Unauthorized` — brak/nieprawidłowy token
  - `404 Not Found` — brak tematu dla `topicId`
  - `500 Internal Server Error` — nieoczekiwany błąd serwera/DB

### 5. Przepływ danych
1) Astro API Route (`src/pages/api/topics/...`).
2) Walidacja nagłówka `Authorization` i tokenu (wg `src/pages/api/README.md`).
3) Walidacja `topicId` oraz query (Zod) → 400 przy błędach.
4) Wywołanie serwisu `TopicsService` (nowy plik w `src/lib/services/`).
5) Zapytania do Supabase (tabele: `topics`, `topic_dependencies`, `sections`, `learning_content`).
6) Mapowanie danych do DTO z `src/types.ts`.
7) Odpowiedź JSON poprzez `createSuccessResponse`. Błędy: `ErrorResponses.*`.

### 6. Względy bezpieczeństwa
- Wymagane JWT (401 gdy brak/nieprawidłowy token) mimo RLS wyłączonego dla tabel referencyjnych.
- Brak ujawniania danych wrażliwych — zwracamy tylko kolumny zdefiniowane w DTO.
- Odrzucanie nieprawidłowych wartości `usage_type` i `is_verified` (Zod → 400).
- Ochrona przed `UUID guessing` — zwracamy 404, jeśli `topicId` nie istnieje.
- Logowanie błędów serwera `console.error`, oczekiwanych błędów walidacji `console.warn`.

### 7. Obsługa błędów
- 400 INVALID_INPUT: nieprawidłowy `topicId` (nie-UUID), niepoprawne `usage_type`/`is_verified`.
- 401 UNAUTHORIZED: brak nagłówka Bearer lub nieprawidłowy/wygaśnięty token.
- 404 NOT_FOUND: brak tematu dla `topicId` (dotyczy również dependencies/content — gdy temat nie istnieje).
- 500 INTERNAL_ERROR: błędy DB/Supabase, wyjątki nieprzewidziane.

### 8. Rozważania dotyczące wydajności
- Indeksy istniejące wg `db-plan.md`: `learning_content(topic_id)`, itp.
- W zapytaniach wybierać wyłącznie potrzebne kolumny.
- Filtry `usage_type` i `is_verified` zawężają rekordy; brak paginacji w MVP.
- W przyszłości: ewentualna paginacja contentu i CDN dla zasobów `images` w `content`.

### 9. Kroki implementacji

#### 9.1. Dodanie serwisu `TopicsService`
Plik: `src/lib/services/topics.service.ts`

Zakres odpowiedzialności: odczyt danych tematów, zależności i contentu.

Proponowane API (TypeScript – komentarze/logi po angielsku):

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../..//db/database.types';
import type {
  TopicDTO,
  TopicDependenciesResponseDTO,
  TopicDependencyDTO,
  LearningContentDTO,
  LearningContentListResponseDTO,
  ContentUsageType,
} from '../..//types';

export class TopicsService {
  async getTopicById(
    supabase: SupabaseClient<Database>,
    topicId: string
  ): Promise<TopicDTO | null> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, section_id, title, description, display_order, created_at')
        .eq('id', topicId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null; // not found
        console.error('Error fetching topic by id:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      return data as unknown as TopicDTO;
    } catch (e) {
      console.error('Unexpected error in getTopicById:', e);
      throw e;
    }
  }

  async getTopicDependencies(
    supabase: SupabaseClient<Database>,
    topicId: string
  ): Promise<TopicDependenciesResponseDTO> {
    try {
      // Strategy: join topic_dependencies → topics (dependency) → sections (for section_title)
      const { data, error } = await supabase
        .from('topic_dependencies')
        .select(
          `
          dependency:topics (
            id,
            title,
            description,
            section_id,
            sections ( title )
          )
        `
        )
        .eq('topic_id', topicId);

      if (error) {
        console.error('Error fetching topic dependencies:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      const dependencies: TopicDependencyDTO[] = (data || []).map((row: any) => ({
        id: row.dependency?.id,
        title: row.dependency?.title,
        description: row.dependency?.description ?? null,
        section_id: row.dependency?.section_id,
        section_title: row.dependency?.sections?.title ?? '',
      }));

      return { topic_id: topicId, dependencies };
    } catch (e) {
      console.error('Unexpected error in getTopicDependencies:', e);
      throw e;
    }
  }

  async getLearningContent(
    supabase: SupabaseClient<Database>,
    topicId: string,
    usageType?: ContentUsageType,
    isVerified?: boolean
  ): Promise<LearningContentListResponseDTO> {
    try {
      let query = supabase
        .from('learning_content')
        .select('id, topic_id, usage_type, content, is_verified, created_at')
        .eq('topic_id', topicId);

      if (usageType) query = query.eq('usage_type', usageType);
      if (typeof isVerified === 'boolean') query = query.eq('is_verified', isVerified);

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching learning content:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return { content: (data || []) as unknown as LearningContentDTO[] };
    } catch (e) {
      console.error('Unexpected error in getLearningContent:', e);
      throw e;
    }
  }
}

export const topicsService = new TopicsService();
```

Uwagi:
- RLS dla `topics`, `learning_content` jest wyłączone wg `db-plan.md`, dlatego korzystamy z klienta użytkownika, ale API nadal wymaga JWT.
- W zapytaniach zwracamy wyłącznie kolumny obecne w DTO.

#### 9.2. Endpoint: GET `/api/topics/[topicId].ts`
Plik: `src/pages/api/topics/[topicId].ts`

Założenia implementacyjne:
- Walidacja JWT zgodnie z `src/pages/api/README.md` (pobranie użytkownika przez `locals.supabase.auth.getUser(token)`).
- Walidacja `topicId` (UUID) przez Zod; przy błędach → 400.
- Pobranie tematu; jeśli `null` → 404.
- Zwrócenie `TopicDTO` → 200.

Szkielet:
```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSuccessResponse, ErrorResponses } from '../../../lib/utils/api-response';
import { topicsService } from '../../../lib/services/topics.service';

const paramsSchema = z.object({ topicId: z.string().uuid() });

export const GET: APIRoute = async ({ request, params, locals }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Missing auth header');
      return ErrorResponses.unauthorized('Missing authentication token');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await locals.supabase.auth.getUser(token);
    if (error || !user) {
      console.warn('Invalid token');
      return ErrorResponses.unauthorized('Invalid or expired token');
    }

    const parse = paramsSchema.safeParse(params);
    if (!parse.success) {
      console.warn('Invalid topicId', parse.error.flatten());
      return ErrorResponses.badRequest('Invalid topicId', parse.error.flatten());
    }
    const { topicId } = parse.data;

    const topic = await topicsService.getTopicById(locals.supabase, topicId);
    if (!topic) return ErrorResponses.notFound('Topic not found');

    return createSuccessResponse(topic, 200);
  } catch (e) {
    console.error('GET /api/topics/:topicId error', e);
    return ErrorResponses.internalError();
  }
};
```

#### 9.3. Endpoint: GET `/api/topics/[topicId]/dependencies.ts`
Plik: `src/pages/api/topics/[topicId]/dependencies.ts`

Założenia implementacyjne:
- Weryfikacja JWT jak wyżej.
- Walidacja `topicId` (UUID) przez Zod.
- Opcjonalnie: sprawdzenie istnienia tematu przed pobraniem zależności (jeśli `getTopicDependencies` zakłada istnienie tematu).
- Zwrócenie `TopicDependenciesResponseDTO` → 200.

Szkielet:
```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSuccessResponse, ErrorResponses } from '../../../../lib/utils/api-response';
import { topicsService } from '../../../../lib/services/topics.service';

const paramsSchema = z.object({ topicId: z.string().uuid() });

export const GET: APIRoute = async ({ request, params, locals }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Missing auth header');
      return ErrorResponses.unauthorized('Missing authentication token');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await locals.supabase.auth.getUser(token);
    if (error || !user) return ErrorResponses.unauthorized('Invalid or expired token');

    const parse = paramsSchema.safeParse(params);
    if (!parse.success) {
      console.warn('Invalid topicId', parse.error.flatten());
      return ErrorResponses.badRequest('Invalid topicId', parse.error.flatten());
    }
    const { topicId } = parse.data;

    // Optional: ensure topic exists → return 404 if not
    const topic = await topicsService.getTopicById(locals.supabase, topicId);
    if (!topic) return ErrorResponses.notFound('Topic not found');

    const response = await topicsService.getTopicDependencies(locals.supabase, topicId);
    return createSuccessResponse(response, 200);
  } catch (e) {
    console.error('GET /api/topics/:topicId/dependencies error', e);
    return ErrorResponses.internalError();
  }
};
```

#### 9.4. Endpoint: GET `/api/topics/[topicId]/content.ts`
Plik: `src/pages/api/topics/[topicId]/content.ts`

Założenia implementacyjne:
- Weryfikacja JWT jak wyżej.
- Walidacja `topicId` + query (Zod). Transformacja `is_verified` na boolean.
- Opcjonalne sprawdzenie istnienia tematu; 404 jeśli brak.
- Zwrócenie `LearningContentListResponseDTO` → 200.

Szkielet:
```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSuccessResponse, ErrorResponses } from '../../../../lib/utils/api-response';
import { topicsService } from '../../../../lib/services/topics.service';

const paramsSchema = z.object({ topicId: z.string().uuid() });
const querySchema = z.object({
  usage_type: z.enum(['explanation','exercise','diagnostic_question']).optional(),
  is_verified: z.enum(['true','false']).transform(v => v === 'true').optional(),
});

export const GET: APIRoute = async ({ request, params, locals }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Missing auth header');
      return ErrorResponses.unauthorized('Missing authentication token');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await locals.supabase.auth.getUser(token);
    if (error || !user) return ErrorResponses.unauthorized('Invalid or expired token');

    const p = paramsSchema.safeParse(params);
    if (!p.success) {
      console.warn('Invalid topicId', p.error.flatten());
      return ErrorResponses.badRequest('Invalid topicId', p.error.flatten());
    }
    const url = new URL(request.url);
    const q = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!q.success) {
      console.warn('Invalid query', q.error.flatten());
      return ErrorResponses.badRequest('Invalid query parameters', q.error.flatten());
    }

    const { topicId } = p.data;
    const { usage_type, is_verified } = q.data;

    const topic = await topicsService.getTopicById(locals.supabase, topicId);
    if (!topic) return ErrorResponses.notFound('Topic not found');

    const result = await topicsService.getLearningContent(
      locals.supabase,
      topicId,
      usage_type,
      typeof is_verified === 'boolean' ? is_verified : undefined
    );

    return createSuccessResponse(result, 200);
  } catch (e) {
    console.error('GET /api/topics/:topicId/content error', e);
    return ErrorResponses.internalError();
  }
};
```

#### 9.5. Testy i weryfikacja
- Ręczne: curl / HTTPie / REST Client.
  - 401: bez nagłówka / z błędnym tokenem.
  - 400: `topicId=not-uuid`, `usage_type=invalid`, `is_verified=maybe`.
  - 404: poprawny token + nieistniejący `topicId`.
  - 200: scenariusze sukcesu.
- Skrypty (analogicznie do istniejących `test-profile-endpoint.sh`): dodać analogiczne skrypty do testów topic view (opcjonalnie w tym etapie).

#### 9.6. Dokumentacja i porządkowanie
- Dodać wpisy do `src/pages/api/README.md` z przykładowymi wywołaniami i opisem.
- Upewnić się, że importy i ścieżki są zgodne ze strukturą projektu (Astro 5 / TS 5).

---

### 10. Mapowanie kodów statusu (konkretne przypadki)
- 200 OK — poprawny odczyt.
- 400 Bad Request — błąd walidacji `topicId`/query (Zod → `ErrorResponses.badRequest`).
- 401 Unauthorized — brak/nieprawidłowy token (wzorzec z `README.md`).
- 404 Not Found — temat nie istnieje.
- 500 Internal Server Error — błędy DB/nieoczekiwane wyjątki.

### 11. Zależności i konfiguracja
- Upewnić się, że `zod` jest w `package.json` (jeśli nie, dodać).
- Wykorzystać istniejące narzędzia: `createSuccessResponse`, `ErrorResponses`.
- Supabase URL i klucze skonfigurowane (middleware dostarcza `locals.supabase`).

### 12. Ryzyka i mitigacje
- Brak RLS na tabelach referencyjnych → API wymaga JWT oraz ograniczamy kolumny w SELECT.
- Złożone joina dla dependencies → w razie problemów rozważyć widok SQL (np. `vw_topic_dependencies`) lub dwuetapowe pobranie danych.
- Rozrost ilości contentu → w przyszłości dodać paginację i limity.


