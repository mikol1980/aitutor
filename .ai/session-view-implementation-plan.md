## API Endpoint Implementation Plan: GET /api/sessions/{sessionId}

### 1. Przegląd punktu końcowego
- **Cel**: Zwrócenie szczegółów pojedynczej sesji nauki użytkownika wraz z tytułem powiązanego tematu.
- **Zakres**: Tylko właściciel sesji (auth.uid() = sessions.user_id) może odczytać szczegóły. Inni użytkownicy otrzymują błąd 403 (jeśli rozpoznano istnienie zasobu) lub 404.
- **Zgodność**: Astro 5 + TypeScript 5 + Supabase; wykorzystanie `Astro.locals.supabase` oraz DTO z `src/types.ts`.

### 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/sessions/{sessionId}`
- **Parametry**:
  - **Wymagane**: `sessionId` (UUID) – parametr ścieżki
  - **Opcjonalne**: brak
- **Nagłówki/Uwierzytelnienie**:
  - Preferowane: sesja Supabase z ciasteczek ustawianych przez middleware (`sb-access-token`, `sb-refresh-token`).
  - Alternatywnie: `Authorization: Bearer <JWT>` (jeśli konfiguracja middleware dopuszcza). 
- **Request Body**: brak

### 3. Wykorzystywane typy
- **DTO**:
  - `SessionDetailsDTO` (z `src/types.ts`): rozszerza encję `SessionEntity` o `topic_title: string | null`.
- **Inne**:
  - `ApiErrorResponseDTO` (z `src/types.ts`) – standardowy format błędów.
  - Helpery odpowiedzi: `createSuccessResponse`, `ErrorResponses` z `src/lib/utils/api-response.ts`.

### 4. Szczegóły odpowiedzi
- **200 OK** – zwraca `SessionDetailsDTO`:
  - Pola: `id`, `user_id`, `topic_id`, `topic_title`, `started_at`, `ended_at`, `ai_summary`.
- **Kody błędów**:
  - `400 Bad Request` – nieprawidłowy `sessionId` (nie-UUID).
  - `401 Unauthorized` – brak ważnej sesji użytkownika.
  - `403 Forbidden` – sesja istnieje, ale należy do innego użytkownika.
  - `404 Not Found` – sesja nie istnieje (lub brak rozróżnienia z uwagi na RLS, patrz Bezpieczeństwo).
  - `500 Internal Server Error` – nieoczekiwany błąd serwera.

### 5. Przepływ danych
1. Middleware (`src/middleware/index.ts`) tworzy klienta Supabase i próbuje odtworzyć sesję z ciasteczek. Klient dostępny w `Astro.locals.supabase`.
2. Endpoint odczytuje `sessionId` z `Astro.params` i waliduje przez Zod (`uuid`).
3. Endpoint sprawdza autoryzację użytkownika (czy jest zalogowany, `getSession()` zwraca sesję oraz `user.id`).
4. Serwis sesji wykonuje zapytanie do bazy:
   - Preferowane jedno zapytanie z relacją: `from('sessions').select('id,user_id,topic_id,started_at,ended_at,ai_summary, topics(title)')...single()`.
   - RLS zwróci wiersz tylko dla właściciela. Jeśli brak wiersza: może to oznaczać brak zasobu lub brak uprawnień.
5. Aby spełnić rozróżnienie 403/404 ze specyfikacji:
   - Jeśli dostępna zmienna środowiskowa z kluczem service role (np. `SUPABASE_SERVICE_ROLE_KEY`), w serwisie użyj tymczasowego klienta admin (tylko po stronie serwera) do sprawdzenia istnienia sesji po `id` bez zwracania wrażliwych danych:
     - Jeśli istnieje i `user_id !== authUserId` → zwróć 403.
     - Jeśli nie istnieje → 404.
   - Jeśli klucz service role nie jest dostępny → bezpieczny fallback: zwróć 404 (RLS nie pozwala odróżnić przypadków bez narażania danych).
6. Zwróć zmapowany `SessionDetailsDTO` przez `createSuccessResponse`.

### 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane. Korzystamy z sesji Supabase utworzonej w middleware. Brak sesji → 401.
- **Autoryzacja**: RLS `sessions` wymaga `auth.uid() = user_id`. Dodatkowo (jeśli dostępny service role) robimy kontrolę istnienia rekordu aby rozróżnić 403/404 bez ujawniania treści.
- **IDOR**: Walidacja `sessionId` (UUID) i weryfikacja właścicielstwa; brak ujawniania szczegółów sesji cudzych użytkowników.
- **Klucz service role**: Jeśli używany, tylko po stronie serwera (endpoint), nie wycieka do klienta; zapytanie wyłącznie „existence check” z natychmiastowym odrzuceniem przy niezgodnym `user_id`.
- **Zastrzeżenia RLS**: Bez service role RLS uniemożliwia rozróżnienie 403 vs 404 – akceptowalny fallback.
- **Walidacja wejścia**: Zod; wczesne zwracanie 400 dla nie-UUID.
- **Brak SQL injection**: Supabase query builder.
- **Rate limiting**: (opcjonalnie) można dodać na poziomie CDN/Edge lub middleware.

### 7. Obsługa błędów
- Użycie `ErrorResponses`:
  - `ErrorResponses.badRequest('Invalid sessionId', { sessionId })` → 400
  - `ErrorResponses.unauthorized()` → 401
  - `createErrorResponse('FORBIDDEN', 'You are not allowed to access this session', 403)` → 403
  - `ErrorResponses.notFound('Session not found')` → 404
  - `ErrorResponses.internalError()` → 500
- Logowanie:
  - W przypadku 500 – log serwerowy (console/error logger). Brak dedykowanej tabeli błędów w schemacie – opcjonalnie można wprowadzić `api_errors` w przyszłości.

### 8. Rozważania dotyczące wydajności
- Pojedyncze zapytanie po PK (`sessions.id`) + join do `topics` po PK – szybkie (indeksy domyślne PK). 
- Brak pętli, brak N+1.
- Unikać zbędnych pól w selekcie.

### 9. Kroki implementacji
1. **Walidacja wejścia**
   - Dodaj Zod schemat `sessionIdSchema = z.string().uuid()` w pliku endpointu.
2. **Service**: utwórz `src/lib/services/sessions.service.ts` z funkcjami:
   - `getSessionDetails(supabase, sessionId: string): Promise<SessionDetailsDTO | null>` – zapytanie z RLS, join do `topics(title)`; mapowanie do DTO.
   - `checkSessionOwnershipWithAdmin(sessionId: string): Promise<'not_found' | { user_id: string }>` – tylko jeśli `SUPABASE_SERVICE_ROLE_KEY` dostępny. Tworzy tymczasowego admin-klienta, pobiera `user_id` po `id`, nie zwraca innych pól.
3. **Endpoint**: utwórz `src/pages/api/sessions/[sessionId].ts` (GET):
   - Pobierz `supabase` z `Astro.locals` i `sessionId` z `Astro.params`.
   - Waliduj `sessionId`; jeśli nie-UUID → 400.
   - Sprawdź sesję użytkownika (`supabase.auth.getSession()`); brak → 401.
   - Wywołaj `getSessionDetails(...)`:
     - Jeśli zwróci DTO → 200.
     - Jeśli `null` → (opcjonalnie) wywołaj `checkSessionOwnershipWithAdmin(...)`:
       - `'not_found'` → 404.
       - `{ user_id }` i `user_id !== currentUserId` → 403.
       - W przeciwnym razie → 404 (zachowawczo).
4. **Helpery odpowiedzi**
   - (Opcjonalnie) rozszerz `ErrorResponses` o `forbidden: (message = 'Forbidden') => createErrorResponse('FORBIDDEN', message, 403)`.
5. **Typowanie**
   - Używaj `SessionDetailsDTO` i typów z `src/types.ts`.
   - Importuj typ `Database` z `src/db/database.types.ts` przy tworzeniu admin-klienta.
6. **Konfiguracja środowiska**
   - Dodaj `SUPABASE_SERVICE_ROLE_KEY` do `.env` (tylko backend). Nie używać w przeglądarce.
7. **Testy ręczne**
   - Scenariusze: 200 (własna sesja), 404 (brak), 403 (cudza sesja), 400 (zły UUID), 401 (brak sesji).

### 10. Scenariusze błędów i kody stanu
- Zły format `sessionId` → 400
- Brak tokenu/ciasteczek lub nieważna sesja → 401
- Sesja nie istnieje → 404
- Sesja istnieje, ale nie należy do użytkownika → 403 (z admin-check), inaczej 404 (fallback)
- Błąd bazy/Supabase → 500
