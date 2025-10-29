## API Endpoint Implementation Plan: GET /api/sections

### 1. Przegląd punktu końcowego
Punkt końcowy zwraca listę wszystkich sekcji (działów) uporządkowaną rosnąco po `display_order`. Dostęp wymaga uwierzytelnionej sesji (JWT/Supabase Auth). Dane są odczytywane z tabeli `sections` i zwracane w formacie zgodnym z `SectionListResponseDTO`.

### 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **URL**: `/api/sections`
- **Parametry**:
  - **Wymagane**: brak
  - **Opcjonalne**: brak (lista niewielka; paginacja nie jest wymagana w MVP)
- **Nagłówki**:
  - `Authorization: Bearer <JWT>` (wymagane; sesja odbudowywana także z ciasteczek przez middleware)
- **Body**: brak

### 3. Wykorzystywane typy
- **SectionDTO** (`src/types.ts`)
- **SectionListResponseDTO** (`src/types.ts`)
- **ApiErrorResponseDTO** (`src/types.ts`)

### 4. Szczegóły odpowiedzi
- **200 OK** – sukces
  - Body (`application/json`):
    ```json
    {
      "sections": [
        {
          "id": "uuid",
          "title": "Funkcje",
          "description": "Zagadnienia związane z funkcjami matematycznymi",
          "display_order": 1,
          "created_at": "2025-10-13T10:00:00Z"
        }
      ]
    }
    ```
- **401 Unauthorized** – brak/wygasła sesja lub nieprawidłowy token
  - Body zgodne z `ApiErrorResponseDTO`
- **500 Internal Server Error** – błąd serwera/bazy
  - Body zgodne z `ApiErrorResponseDTO`

### 5. Przepływ danych
1. Klient wywołuje `GET /api/sections` z nagłówkiem `Authorization` lub z aktywnymi ciasteczkami sesji.
2. Astro middleware (`src/middleware/index.ts`) tworzy `locals.supabase` i próbuje odtworzyć sesję z cookies.
3. Handler API (`src/pages/api/sections.ts`) wykonywany w try/catch:
   - Pobiera sesję przez `locals.supabase.auth.getSession()`; w razie braku zwraca `401` z `ErrorResponses.unauthorized`.
   - Wywołuje serwis `sectionsService.listSections(locals.supabase)`.
4. Serwis (`src/lib/services/sections.service.ts`):
   - Czyta z tabeli `sections` (RLS wyłączone wg planu DB), wybiera tylko pola: `id, title, description, display_order, created_at`.
   - `order('display_order', { ascending: true }).order('id', { ascending: true })` dla stabilności sortowania.
   - Mapuje wynik na `SectionDTO[]` (pola już są izomorficzne) i zwraca.
5. Handler API zwraca `createSuccessResponse<SectionListResponseDTO>({ sections })` i ustawia nagłówki `Content-Type: application/json`. Opcjonalnie: `Cache-Control: private, max-age=60` oraz `ETag`/`Last-Modified` (MVP: pomijamy, patrz Wydajność).

### 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: wymagane – weryfikacja aktywnej sesji przez `locals.supabase.auth.getSession()`; brak sesji → `401`.
- **Autoryzacja/RLS**: `sections` ma RLS wyłączone (treści referencyjne). Ograniczamy eksplorację do whitelisty kolumn.
- **Ekspozycja danych**: nigdy nie zwracamy dodatkowych kolumn (allowlist w SELECT).
- **Nagłówki**: nie logujemy ani nie odsyłamy wrażliwych danych tokenów.
- **Rate limiting**: opcjonalnie dodać globalny mechanizm rate-limit (np. middleware) – poza zakresem implementacji endpointu.

### 7. Obsługa błędów
- **401 Unauthorized**: brak/wygasła sesja, błąd walidacji JWT – `ErrorResponses.unauthorized('Brak aktywnej sesji...')`.
- **500 Internal Server Error**: błędy bazy (połączenie, timeout, zapytanie) lub inne nieoczekiwane – `ErrorResponses.internalError()`; log `console.error` z kontekstem.
- **405 Method Not Allowed**: opcjonalnie odrzucenie metod innych niż GET (Astro domyślnie wymaga eksportu konkretnej metody; brak implementacji innej metody skutecznie blokuje pozostałe).

### 8. Rozważania dotyczące wydajności
- **Selektor kolumn**: wybieramy tylko potrzebne pola (unikamy `*`).
- **Sortowanie po indeksowalnej kolumnie**: `display_order` – przy dużej skali rozważyć indeks po `display_order`; w MVP liczność niewielka.
- **Cache aplikacyjne/CDN**: krótkie cache (np. 60s, prywatne) lub revalidation po edycji sekcji (poza MVP).
- **Stabilne sortowanie**: dodatkowe sortowanie po `id` minimalizuje wahania kolejności przy identycznym `display_order`.

### 9. Kroki implementacji
1. **Serwis sekcji**: utworzyć `src/lib/services/sections.service.ts`
   - Eksport: `sectionsService` z metodą `listSections(supabase)`.
   - Zapytanie: `.from('sections').select('id, title, description, display_order, created_at').order('display_order', { ascending: true }).order('id', { ascending: true })`.
   - Obsługa błędów: `throw new Error('Database error: ...')` po zalogowaniu szczegółów.
2. **Endpoint API**: utworzyć `src/pages/api/sections.ts`
   - Eksport `GET: APIRoute` wzorowany na `src/pages/api/profile.ts`.
   - Sprawdzenie sesji (jak w `/api/profile`).
   - Wywołanie serwisu i zwrot `createSuccessResponse({ sections })`.
   - Obsługa błędów: `ErrorResponses.unauthorized`, `ErrorResponses.internalError` + `console.warn/error`.
3. **Walidacja (opcjonalnie Zod)**:
   - Dodać `SectionRowSchema` i `SectionListResponseSchema` (dla bezpieczeństwa typów runtime), zastosować w serwisie przed zwrotem.
4. **Test ręczny/skrypt**: dodać `test-sections-endpoint.sh` z przykładowym `curl` (nagłówek `Authorization: Bearer <JWT>`), asercja statusu 200 i kształtu odpowiedzi.
5. **Dokumentacja**: uzupełnić `README.md` sekcją „API: GET /api/sections”.

### 10. Kryteria akceptacji
- Dla użytkownika z ważną sesją `GET /api/sections` zwraca `200` i listę sekcji w kolejności `display_order`.
- Bez sesji/zepsuty token zwracane jest `401` w formacie `ApiErrorResponseDTO`.
- Błędy bazy zwracają `500` z generycznym komunikatem, bez wycieku szczegółów.
- Zwracane są wyłącznie pola: `id, title, description, display_order, created_at`.

