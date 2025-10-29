# API Endpoint Implementation Plan: GET /api/user-progress (User Progress Overview)

## 1. Przegląd punktu końcowego
Zwraca przegląd postępów użytkownika we wszystkich tematach, z możliwością filtrowania po sekcji i statusie postępu. Dane zawierają listę postępów z metadanymi sekcji/tematu oraz zagregowane statystyki podsumowujące.

## 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/user-progress`
- **Parametry**:
  - **Wymagane**: brak
  - **Opcjonalne**:
    - `section_id` (UUID): filtruje postępy do tematów w danej sekcji
    - `status` (enum): jeden z `not_started | in_progress | completed`
- **Request Body**: brak

## 3. Wykorzystywane typy
- `UserProgressWithDetailsDTO` (lista pozycji w polu `progress`)
- `UserProgressSummaryDTO` (pole `summary`)
- `UserProgressOverviewResponseDTO` (struktura odpowiedzi)
- `UserProgressStatus` (enum statusów)
- `ApiErrorResponseDTO` (błędy)

Źródło typów: `src/types.ts`.

## 4. Szczegóły odpowiedzi
- **200 OK** – sukces
  - Struktura:
    ```json
    {
      "progress": [
        {
          "user_id": "uuid",
          "section_id": "uuid",
          "section_title": "string",
          "topic_id": "uuid",
          "topic_title": "string",
          "status": "not_started|in_progress|completed",
          "score": 0.0,
          "updated_at": "2025-10-13T12:45:00Z"
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
- **400 Bad Request** – nieprawidłowe parametry (`section_id`, `status`)
- **401 Unauthorized** – brak lub nieprawidłowa sesja
- **500 Internal Server Error** – błąd serwera/bazy danych

## 5. Przepływ danych
1. Middleware (`src/middleware/index.ts`) dołącza uwierzytelnionego klienta Supabase w `context.locals.supabase` i zarządza sesją cookie.
2. Handler GET w `src/pages/api/user-progress/index.ts`:
   - Waliduje parametry query (Zod).
   - Sprawdza sesję i użytkownika przez `locals.supabase.auth.getSession()` oraz `getUser()`.
   - Wywołuje `progressService.getUserProgressOverview(supabase, { sectionId?, status? })`.
   - Zwraca JSON przez `createSuccessResponse(...)`.
3. `ProgressService` (nowy plik `src/lib/services/progress.service.ts`):
   - Wykonuje zapytanie do `user_progress` z dołączeniem `topics` i `sections` (tylko wymagane kolumny).
   - Uwzględnia RLS: rekordy filtrowane po `user_id = auth.uid()` przez Supabase.
   - Opcjonalne filtry: `topics.section_id = sectionId`, `user_progress.status = status`.
   - Mapuje wynik do `UserProgressWithDetailsDTO[]`.
   - Wylicza `summary` na podstawie otrzymanej listy (lub alternatywnie poprzez agregację SQL).

Schemat selekcji (PostgREST-syntax):
```
from('user_progress').select(`
  user_id,
  topic_id,
  status,
  score,
  updated_at,
  topics!inner (
    id,
    title,
    section_id,
    sections!inner (
      id,
      title
    )
  )
`)
```

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie**: wymagane; weryfikacja aktywnej sesji przez `locals.supabase.auth`.
- **Autoryzacja/RLS**: tabele `user_progress` mają RLS – polityka wymusza `auth.uid() = user_id`; backend nie przyjmuje `user_id` z zewnątrz.
- **Selecja kolumn**: jawne kolumny w `select(...)` (bez `*`).
- **Walidacja wejścia**: Zod dla `section_id` (UUID) i `status` (enum).
- **Brak ujawniania danych cudzych użytkowników**: rely on RLS + brak parametrów pozwalających wskazać `user_id`.
- **Rate limiting**: (opcjonalnie) dodać na poziomie edge/proxy; poza zakresem MVP.

## 7. Obsługa błędów
- 400: `INVALID_INPUT` – niepoprawny `UUID`, nieznany `status`.
- 401: `UNAUTHORIZED` – brak sesji lub wygasła.
- 500: `INTERNAL_ERROR` – błędy bazy/dostępu, wyjątki w serwisie.

Forma odpowiedzi błędu: `src/lib/utils/api-response.ts` (`ErrorResponses.badRequest/unauthorized/internalError`).

Rejestrowanie błędów: logi serwerowe (`console.error`) zawierające `message`, `code`, `details`. Brak dedykowanej tabeli błędów – można rozważyć w przyszłości `app_errors` z metadanymi żądania.

## 8. Rozważania dotyczące wydajności
- Indeksy wg planu DB: klucz złożony `user_progress(user_id, topic_id)` oraz FKs przyspieszą joiny.
- Filtry stosowane w SQL (przed mapowaniem) minimalizują transfer danych.
- Dla dużych zbiorów warto wprowadzić stronicowanie – obecnie endpoint zwraca całość; w przyszłości dodać `limit/offset` i metadane.
- Można liczyć `summary` w pamięci z pobranej listy, aby uniknąć drugiego round-trip; alternatywnie jedna agregacja SQL, jeśli lista jest stronicowana w przyszłości.

## 9. Etapy wdrożenia
1. Utwórz serwis postępów
   - Plik: `src/lib/services/progress.service.ts`.
   - Eksport: `progressService` (singleton) i klasa `ProgressService`.
   - Metoda: `getUserProgressOverview(supabase, { sectionId?, status? })` → `{ progress, summary }`.
   - Implementacja:
     - Walidacja argumentów w serwisie (wczesne zwroty przy braku danych).
     - Zapytanie `user_progress` z join do `topics` i `sections` (jak w sekcji „Przepływ danych”).
     - Filtrowanie opcjonalne: `.eq('topics.section_id', sectionId)`, `.eq('status', status)` – uwzględnić tylko jeśli parametry podane.
     - Mapowanie do `UserProgressWithDetailsDTO[]` z bezpieczną obsługą `null` (np. puste tytuły jeśli relacje brakujące, choć w modelu nie powinny).
     - Wyliczenie `summary`: zliczanie `status` i `total_topics = progress.length`, średnia nie jest wymagana dla overview.

2. Dodaj endpoint API
   - Plik: `src/pages/api/user-progress/index.ts`.
   - `export const prerender = false;`
   - Schematy Zod:
     - `section_id`: `z.string().uuid().optional()`
     - `status`: `z.enum(['not_started','in_progress','completed']).optional()`
   - Kroki handlera:
     1) Parsuj i waliduj query (`url.searchParams`).
     2) Sprawdź sesję i użytkownika przez `locals.supabase.auth` (401, gdy brak).
     3) Wywołaj `progressService.getUserProgressOverview(...)` z filtrami.
     4) Zwróć `createSuccessResponse({ progress, summary })` (200).
     5) W `catch` rozróżnij błędy: walidacja (400), baza/połączenie (500), inne (500).

3. Testy ręczne i smoke
   - Dodać skrypt curl/httpie do repo (np. `test-user-progress-endpoint.sh`).
   - Scenariusze:
     - Bez tokena → 401.
     - Z tokenem, bez filtrów → 200 i pełna lista.
     - Z `section_id` poprawnym/niepoprawnym → 200/400.
     - Z `status` spoza enum → 400.

4. Dokumentacja
   - Uzupełnij `README.md` sekcją API: `GET /api/user-progress` (parametry, przykłady odpowiedzi, kody błędów).

5. Przegląd bezpieczeństwa i obserwowalności
   - Potwierdzić, że endpoint nie przyjmuje `user_id` (tylko `locals.supabase` + RLS).
   - Upewnić się, że logi nie zawierają wrażliwych danych.

## 10. Przykładowe szkielety implementacji (do użycia przy wdrożeniu)

Plik serwisu `src/lib/services/progress.service.ts` (zarys):
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { UserProgressWithDetailsDTO, UserProgressSummaryDTO } from '../../types';

export class ProgressService {
  async getUserProgressOverview(
    supabase: SupabaseClient<Database>,
    filters: { sectionId?: string; status?: 'not_started' | 'in_progress' | 'completed' }
  ): Promise<{ progress: UserProgressWithDetailsDTO[]; summary: UserProgressSummaryDTO }> {
    const query = supabase
      .from('user_progress')
      .select(`
        user_id,
        topic_id,
        status,
        score,
        updated_at,
        topics!inner (
          id,
          title,
          section_id,
          sections!inner (
            id,
            title
          )
        )
      `);

    if (filters.sectionId) query.eq('topics.section_id', filters.sectionId);
    if (filters.status) query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw new Error(`Database error: ${error.message}`);

    const progress: UserProgressWithDetailsDTO[] = (data || []).map((row: any) => ({
      user_id: row.user_id,
      section_id: row.topics.sections.id,
      section_title: row.topics.sections.title,
      topic_id: row.topic_id,
      topic_title: row.topics.title,
      status: row.status,
      score: row.score,
      updated_at: row.updated_at ?? null,
    }));

    const summary: UserProgressSummaryDTO = {
      total_topics: progress.length,
      completed: progress.filter(p => p.status === 'completed').length,
      in_progress: progress.filter(p => p.status === 'in_progress').length,
      not_started: progress.filter(p => p.status === 'not_started').length,
    };

    return { progress, summary };
  }
}

export const progressService = new ProgressService();
```

Plik endpointu `src/pages/api/user-progress/index.ts` (zarys):
```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { progressService } from '../../../lib/services/progress.service';
import { createSuccessResponse, ErrorResponses } from '../../../lib/utils/api-response';

export const prerender = false;

const QuerySchema = z.object({
  section_id: z.string().uuid().optional(),
  status: z.enum(['not_started','in_progress','completed']).optional(),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const params = {
      section_id: url.searchParams.get('section_id') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    };

    const parsed = QuerySchema.safeParse(params);
    if (!parsed.success) {
      return ErrorResponses.badRequest(parsed.error.errors[0]?.message || 'Nieprawidłowe parametry');
    }

    const { data: { session } } = await locals.supabase.auth.getSession();
    if (!session) return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');

    const { progress, summary } = await progressService.getUserProgressOverview(locals.supabase, {
      sectionId: parsed.data.section_id,
      status: parsed.data.status,
    });

    return createSuccessResponse({ progress, summary }, 200);
  } catch (error) {
    return ErrorResponses.internalError();
  }
};
```


