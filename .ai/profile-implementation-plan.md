# API Endpoint Implementation Plan: GET /api/profile

## 1. Przegląd punktu końcowego

Endpoint **GET /api/profile** służy do pobrania informacji o profilu zalogowanego użytkownika. Jest to prosty endpoint typu read-only, który zwraca pełne dane profilu (login, email, status ukończenia tutoriala, data utworzenia) dla użytkownika zidentyfikowanego za pomocą JWT tokena. 

Endpoint wykorzystuje mechanizm Row Level Security (RLS) Supabase, który automatycznie ogranicza dostęp do danych tylko dla zalogowanego użytkownika, zapewniając bezpieczeństwo na poziomie bazy danych.

**Główne cele:**
- Umożliwienie frontendowi pobrania danych profilu zalogowanego użytkownika
- Sprawdzenie, czy użytkownik ukończył tutorial (`has_completed_tutorial`)
- Zapewnienie bezpiecznego dostępu tylko do własnego profilu

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/profile
```

### Nagłówki żądania
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Parametry

**Wymagane:**
- **Authorization header**: JWT Bearer token otrzymany podczas logowania przez Supabase Auth
  - Format: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Token musi być ważny i nie wygasły (domyślnie: 1 godzina ważności)
  - Token zawiera claim `sub` z user ID

**Opcjonalne:**
- Brak

**Request Body:**
- Brak (metoda GET)

**Query Parameters:**
- Brak

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**ProfileDTO** - typ odpowiedzi zwracanej przez endpoint:
```typescript
export type ProfileDTO = ProfileEntity;

export interface ProfileEntity {
  id: string;                      // UUID użytkownika (zgodny z auth.users.id)
  login: string;                   // Login użytkownika (min. 3 znaki, unique)
  email: string;                   // Email użytkownika (unique)
  has_completed_tutorial: boolean; // Czy użytkownik ukończył tutorial
  created_at: string;              // ISO timestamp utworzenia profilu
}
```

**ApiErrorResponseDTO** - typ odpowiedzi błędu:
```typescript
export interface ApiErrorResponseDTO {
  error: {
    code: string;           // Kod błędu (np. 'UNAUTHORIZED', 'NOT_FOUND')
    message: string;        // Przyjazny dla użytkownika komunikat
    details?: ErrorDetailDTO | Record<string, any>; // Opcjonalne szczegóły
  };
}
```

### Command Models

**Brak** - endpoint GET nie wymaga Command Models (nie przyjmuje danych wejściowych w body).

### Typy pomocnicze

**SupabaseClient** - typ klienta Supabase z middleware:
```typescript
// Dostępny w context.locals.supabase
// Automatycznie stosuje RLS policies
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

**Struktura:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "login": "student123",
  "email": "student@example.com",
  "has_completed_tutorial": false,
  "created_at": "2025-10-13T10:30:00Z"
}
```

**Opis pól:**
- `id`: UUID użytkownika, odpowiada `auth.users.id` w Supabase
- `login`: Unikalny login użytkownika (walidacja: min. 3 znaki)
- `email`: Unikalny email użytkownika
- `has_completed_tutorial`: Boolean wskazujący, czy użytkownik ukończył onboarding tutorial
- `created_at`: Timestamp utworzenia profilu w formacie ISO 8601

### Error Responses

#### 401 Unauthorized - Brak lub nieprawidłowy token
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

**Przypadki:**
- Brak nagłówka `Authorization`
- Token JWT nieprawidłowy (błędny format)
- Token wygasły (domyślnie po 1 godzinie)
- Token anulowany (użytkownik wylogowany)

#### 404 Not Found - Profil nie istnieje
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Profile not found"
  }
}
```

**Przypadki:**
- Użytkownik istnieje w `auth.users`, ale nie ma odpowiadającego rekordu w `profiles`
- Może wystąpić, jeśli trigger `handle_new_user()` nie zadziałał poprawnie podczas rejestracji

#### 500 Internal Server Error - Błąd serwera
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

**Przypadki:**
- Błąd połączenia z bazą danych Supabase
- Nieoczekiwany błąd w logice aplikacji
- Timeout zapytania do bazy

## 5. Przepływ danych

### Architektura warstw

```
[Client] 
   ↓ HTTP GET /api/profile + Authorization header
[Astro API Route: /src/pages/api/profile.ts]
   ↓ Walidacja autentykacji
[Middleware: context.locals.supabase]
   ↓ Wywołanie serwisu
[ProfileService: /src/lib/services/profile.service.ts]
   ↓ Zapytanie do bazy z RLS
[Supabase Database: profiles table]
   ↓ Weryfikacja RLS policy
[PostgreSQL Row Level Security]
   ↓ Zwrócenie danych profilu
[ProfileService] 
   ↓ Mapowanie na ProfileDTO
[Astro API Route]
   ↓ HTTP 200 + JSON response
[Client]
```

### Szczegółowy przepływ krok po kroku

1. **Żądanie HTTP**
   - Klient wysyła GET request na `/api/profile`
   - Header: `Authorization: Bearer {token}`

2. **Middleware Astro** (`src/middleware/index.ts`)
   - Astro middleware uruchamia się automatycznie
   - Dodaje `supabaseClient` do `context.locals.supabase`
   - Przekazuje kontrolę do route handler

3. **API Route Handler** (`src/pages/api/profile.ts`)
   - Odbiera request
   - Ekstrahuje token z nagłówka `Authorization`
   - Tworzy authenticated Supabase client z tokenem

4. **Walidacja autentykacji**
   - Sprawdzenie obecności tokena
   - Supabase automatycznie weryfikuje ważność tokena JWT
   - Ekstrakcja user ID z tokena (`auth.uid()`)

5. **Wywołanie ProfileService**
   - Przekazanie authenticated Supabase client do serwisu
   - Wywołanie metody `getProfile()`

6. **Zapytanie do bazy danych**
   - ProfileService wykonuje query: `SELECT * FROM profiles WHERE id = auth.uid()`
   - RLS policy automatycznie ogranicza dostęp: `USING (auth.uid() = id)`
   - Supabase zwraca dane lub null

7. **Przetwarzanie wyniku**
   - Jeśli dane zwrócone: mapowanie na ProfileDTO
   - Jeśli null: throw NotFoundError (404)
   - Jeśli błąd połączenia: catch i throw InternalError (500)

8. **Zwrot odpowiedzi**
   - Success: HTTP 200 + ProfileDTO jako JSON
   - Error: Odpowiedni kod HTTP + ApiErrorResponseDTO

### Interakcje z zewnętrznymi serwisami

**Supabase:**
- **Auth Service**: Weryfikacja JWT tokena
- **Database Service**: Zapytanie do tabeli `profiles`
- **RLS Engine**: Automatyczna filtracja danych na poziomie bazy

**Brak innych zewnętrznych serwisów** w MVP.

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)

**Mechanizm:** JWT Bearer token z Supabase Auth

**Implementacja:**
1. Token przekazywany w nagłówku `Authorization: Bearer {token}`
2. Supabase SDK automatycznie weryfikuje:
   - Poprawność sygnatury tokena (HMAC/RSA)
   - Ważność czasową (claim `exp`)
   - Issuer (`iss`) - musi być z Supabase
3. Token zawiera user ID w claim `sub`

**Zabezpieczenia:**
- Token przechowywany w pamięci aplikacji (nie localStorage - ochrona przed XSS)
- Refresh token w httpOnly cookie (ochrona przed XSS)
- HTTPS only w produkcji (ochrona przed MITM)

### Autoryzacja (Authorization)

**Strategia:** Row Level Security (RLS) na poziomie bazy danych

**Implementacja:**
```sql
CREATE POLICY "Allow users to manage their own profile"
ON profiles FOR ALL
USING (auth.uid() = id);
```

**Działanie:**
- Każde zapytanie SQL automatycznie dodaje warunek `WHERE id = auth.uid()`
- Użytkownik może odczytać tylko swój własny profil
- Nawet jeśli kod aplikacji ma błąd, baza danych blokuje dostęp

**Dodatkowo na poziomie aplikacji:**
- Walidacja obecności tokena przed wykonaniem zapytania
- Graceful error handling przy braku autoryzacji

### Walidacja danych

**Input Validation:**
- Brak parametrów wejściowych do walidacji (GET endpoint)
- Walidacja formatu tokena JWT (automatyczna przez Supabase SDK)

**Output Validation:**
- Sprawdzenie, czy zwrócone dane są zgodne z typem ProfileDTO
- Sanitizacja danych przed zwróceniem (usunięcie wrażliwych pól, jeśli istnieją)

### Ochrona przed atakami

**1. Authentication Bypass:**
- **Atak:** Próba dostępu bez tokena lub z nieprawidłowym tokenem
- **Ochrona:** Supabase SDK zwraca error, API zwraca 401

**2. Privilege Escalation:**
- **Atak:** Próba odczytania profilu innego użytkownika poprzez manipulację tokenem
- **Ochrona:** RLS policy ogranicza dostęp do własnego profilu

**3. SQL Injection:**
- **Atak:** Próba wstrzyknięcia SQL przez parametry
- **Ochrona:** Supabase używa parameterized queries, brak parametrów użytkownika

**4. Token Theft:**
- **Atak:** Przechwycenie tokena JWT (XSS, MITM)
- **Ochrona:** 
  - HTTPS w produkcji
  - httpOnly cookies dla refresh tokens
  - Krótki czas życia access tokens (1h)

**5. Denial of Service:**
- **Atak:** Nadmierne zapytania do endpointa
- **Ochrona:** Rate limiting (100 req/min per user - do implementacji w przyszłości)

### Zabezpieczenia CORS

**Konfiguracja:**
- Allowed Origins: `http://localhost:4321` (dev), `https://aitutor.example.com` (prod)
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed Headers: Authorization, Content-Type
- Credentials: true (dla cookies z refresh tokens)

### Logging i Monitoring

**Co logować:**
- Nieudane próby autentykacji (401)
- Błędy 500 z pełnym stack trace (tylko serwer)
- Czas odpowiedzi zapytania (monitoring wydajności)

**Czego NIE logować:**
- Pełne tokeny JWT
- Adresy email użytkowników (GDPR compliance)
- Wrażliwe dane osobowe

## 7. Obsługa błędów

### Katalog potencjalnych błędów

#### 1. Błędy autentykacji (401 Unauthorized)

**Scenariusz 1.1: Brak tokena**
- **Przyczyna:** Nagłówek `Authorization` nie został wysłany
- **Detekcja:** `context.request.headers.get('Authorization')` zwraca null
- **Odpowiedź:**
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Missing authentication token"
    }
  }
  ```
- **HTTP Status:** 401

**Scenariusz 1.2: Nieprawidłowy format tokena**
- **Przyczyna:** Token nie ma formatu `Bearer {token}` lub nie jest poprawnym JWT
- **Detekcja:** Supabase SDK rzuca błąd podczas parsowania tokena
- **Odpowiedź:**
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid authentication token format"
    }
  }
  ```
- **HTTP Status:** 401

**Scenariusz 1.3: Token wygasły**
- **Przyczyna:** Access token przekroczył czas życia (domyślnie 1 godzina)
- **Detekcja:** Supabase SDK weryfikuje claim `exp`
- **Odpowiedź:**
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication token has expired"
    }
  }
  ```
- **HTTP Status:** 401
- **Akcja klienta:** Odświeżenie tokena używając refresh token

**Scenariusz 1.4: Token anulowany**
- **Przyczyna:** Użytkownik wylogował się, token został unieważniony
- **Detekcja:** Supabase sprawdza, czy sesja jest aktywna
- **Odpowiedź:**
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication token has been revoked"
    }
  }
  ```
- **HTTP Status:** 401

#### 2. Błędy zasobów (404 Not Found)

**Scenariusz 2.1: Profil nie istnieje**
- **Przyczyna:** Użytkownik istnieje w `auth.users`, ale nie ma rekordu w `profiles`
- **Możliwe powody:**
  - Trigger `handle_new_user()` nie zadziałał podczas rejestracji
  - Profil został ręcznie usunięty (nie powinno się zdarzyć z ON DELETE CASCADE)
- **Detekcja:** Supabase query zwraca `null` lub pustą tablicę
- **Odpowiedź:**
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Profile not found"
    }
  }
  ```
- **HTTP Status:** 404
- **Akcja serwera:** Log critical error (profil powinien zawsze istnieć dla authenticated user)

#### 3. Błędy serwera (500 Internal Server Error)

**Scenariusz 3.1: Błąd połączenia z bazą danych**
- **Przyczyna:** Supabase niedostępny, timeout połączenia, błąd sieci
- **Detekcja:** Supabase SDK rzuca network error lub timeout error
- **Odpowiedź:**
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "An unexpected error occurred. Please try again later."
    }
  }
  ```
- **HTTP Status:** 500
- **Akcja serwera:** 
  - Log pełny stack trace
  - Powiadomienie o błędzie infrastruktury (monitoring alert)

**Scenariusz 3.2: Nieoczekiwany błąd aplikacji**
- **Przyczyna:** Bug w kodzie, nieobsłużony edge case
- **Detekcja:** Uncaught exception w try-catch block
- **Odpowiedź:**
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "An unexpected error occurred. Please try again later."
    }
  }
  ```
- **HTTP Status:** 500
- **Akcja serwera:**
  - Log pełny stack trace z kontekstem (user ID, timestamp)
  - Nie ujawniać szczegółów błędu klientowi (security concern)

### Strategie obsługi błędów

**1. Graceful Degradation:**
- Zawsze zwracaj poprawnie sformatowaną odpowiedź JSON
- Nigdy nie zwracaj raw error stack traces klientowi
- Użyj generycznych komunikatów dla błędów 500

**2. Error Logging:**
- Błędy 401/404: log INFO level (normalne przypadki użycia)
- Błędy 500: log ERROR level z pełnym kontekstem
- Użyj structured logging (JSON format) dla łatwiejszej analizy

**3. Error Monitoring:**
- Integracja z systemem monitoringu (np. Sentry - future)
- Alerty dla wysokiego wskaźnika błędów 500
- Dashboard z metrykami błędów

**4. Client-side Handling:**
- Klient powinien obsługiwać wszystkie kody błędów
- 401: Redirect do strony logowania lub refresh token flow
- 404: Pokaż komunikat "Profile not found" i zaproponuj kontakt z supportem
- 500: Pokaż przyjazny komunikat "Something went wrong" z możliwością retry

### Przykładowa implementacja error handling

```typescript
try {
  // 1. Walidacja autentykacji
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing authentication token'
        }
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Wywołanie serwisu
  const profile = await profileService.getProfile(supabase);
  
  // 3. Sprawdzenie, czy profil istnieje
  if (!profile) {
    console.error('Profile not found for authenticated user');
    return new Response(
      JSON.stringify({
        error: {
          code: 'NOT_FOUND',
          message: 'Profile not found'
        }
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Zwrot sukcesu
  return new Response(
    JSON.stringify(profile),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
  
} catch (error) {
  // 5. Obsługa nieoczekiwanych błędów
  console.error('Error in GET /api/profile:', error);
  
  // Sprawdź, czy to błąd autentykacji Supabase
  if (error.message?.includes('JWT') || error.code === 'PGRST301') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token'
        }
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Ogólny błąd serwera
  return new Response(
    JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.'
      }
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

**1. Zapytanie do bazy danych:**
- **Problem:** Każde wywołanie endpointa generuje SELECT query do Supabase
- **Czas odpowiedzi:** ~50-100ms (typowo)
- **Wpływ:** Przy dużym obciążeniu może spowolnić aplikację

**2. Weryfikacja JWT tokena:**
- **Problem:** Supabase musi zweryfikować sygnaturę tokena przy każdym request
- **Czas odpowiedzi:** ~10-20ms
- **Wpływ:** Minimalny, ale dodaje się do całkowitego czasu

**3. Latencja sieci:**
- **Problem:** Komunikacja Astro server ↔ Supabase cloud
- **Czas odpowiedzi:** ~20-50ms (zależnie od lokalizacji)
- **Wpływ:** Znaczący przy dużej odległości geograficznej

### Strategie optymalizacji

#### 1. Caching

**Strategia:** Cache profilu użytkownika na krótki okres

**Implementacja:**
- **Client-side caching:**
  - Frontend cache profilu w memory/local state (React Context/Zustand)
  - Ważność cache: 5 minut
  - Invalidacja: Po update profilu (PUT /api/profile)
  - Benefit: Redukcja liczby API calls, lepsza UX (instant load)

- **Server-side caching (future):**
  - Redis cache z user ID jako kluczem
  - TTL: 1 minuta
  - Invalidacja: Po update profilu
  - Benefit: Redukcja obciążenia bazy danych

**Uwagi:**
- Profile rzadko się zmieniają (tylko `has_completed_tutorial`)
- Cache nie powinien być zbyt długi (max 5 min) dla spójności danych

#### 2. Database Indexing

**Obecne indeksy:**
- Primary key index na `profiles.id` (automatyczny)
- Unique index na `profiles.login` (z UNIQUE constraint)
- Unique index na `profiles.email` (z UNIQUE constraint)

**Optymalizacja:**
- Brak dodatkowych indeksów potrzebnych
- Query `WHERE id = ?` korzysta z PK index (bardzo szybkie: O(log n))

#### 3. Connection Pooling

**Implementacja:** Supabase automatycznie zarządza connection pooling

**Konfiguracja:**
- Connection pool size: Zarządzany przez Supabase
- Timeout: Domyślne ustawienia Supabase (~10s)

**Monitoring:**
- Śledzenie liczby aktywnych połączeń
- Alerty przy wyczerpaniu pool

#### 4. Query Optimization

**Obecne zapytanie:**
```sql
SELECT * FROM profiles WHERE id = auth.uid()
```

**Optymalizacje:**
- **Selective fields:** Zamiast `SELECT *`, wybierać tylko potrzebne pola
  ```sql
  SELECT id, login, email, has_completed_tutorial, created_at 
  FROM profiles WHERE id = auth.uid()
  ```
- **Prepared statements:** Supabase automatycznie używa prepared statements
- **RLS optimization:** RLS policy jest bardzo prosta i efektywna

#### 5. Latency Reduction

**Strategia 1: Geographic proximity**
- Deploy aplikacji w regionie blisko Supabase instance
- Użycie CDN dla statycznych zasobów (Astro assets)

**Strategia 2: HTTP/2**
- Astro wspiera HTTP/2 out of the box
- Multiplexing requests dla lepszej wydajności

**Strategia 3: Compression**
- Gzip/Brotli compression dla JSON responses
- Benefit: Redukcja wielkości transferu (ProfileDTO: ~200 bytes → ~100 bytes)

### Metryki wydajności (Target SLA)

**Endpoint: GET /api/profile**

| Metryka | Target | Critical Threshold |
|---------|--------|-------------------|
| P50 (median) latency | < 100ms | > 500ms |
| P95 latency | < 200ms | > 1000ms |
| P99 latency | < 500ms | > 2000ms |
| Error rate | < 0.1% | > 1% |
| Availability | > 99.5% | < 99% |

**Monitoring:**
- Użycie Supabase Dashboard do monitorowania query performance
- Application logs z request timings
- Future: APM tool (np. New Relic, Datadog)

### Load Testing

**Scenariusze testowe:**

1. **Normal Load:**
   - 100 concurrent users
   - 1000 requests/minute
   - Expected: P95 < 200ms

2. **Peak Load:**
   - 500 concurrent users
   - 5000 requests/minute
   - Expected: P95 < 500ms, no errors

3. **Stress Test:**
   - 1000 concurrent users
   - 10000 requests/minute
   - Expected: Graceful degradation, error rate < 5%

**Tools:** Apache JMeter, k6.io

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury katalogów

**Akcja:**
```bash
# Utworzenie katalogu dla serwisów
mkdir -p src/lib/services

# Utworzenie katalogu dla utility funkcji (helper functions)
mkdir -p src/lib/utils

# Utworzenie katalogu dla API endpoints (jeśli nie istnieje)
mkdir -p src/pages/api
```

**Wynik:** Struktura katalogów zgodna z architekturą projektu

---

### Krok 2: Implementacja ProfileService

**Plik:** `src/lib/services/profile.service.ts`

**Funkcjonalność:**
- Metoda `getProfile()` do pobrania profilu użytkownika
- Wykorzystanie Supabase client z RLS
- Obsługa błędów i mapowanie na DTO

**Implementacja:**
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { ProfileDTO } from '../../types';

export class ProfileService {
  /**
   * Get the profile of the authenticated user
   * @param supabase - Authenticated Supabase client
   * @returns ProfileDTO or null if not found
   * @throws Error if database operation fails
   */
  async getProfile(supabase: SupabaseClient<Database>): Promise<ProfileDTO | null> {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Query profiles table with RLS
    const { data, error } = await supabase
      .from('profiles')
      .select('id, login, email, has_completed_tutorial, created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Return null if no profile found (should not happen in normal flow)
    return data;
  }
}

// Export singleton instance
export const profileService = new ProfileService();
```

**Testy jednostkowe (opcjonalnie dla MVP):**
- Test: pobranie istniejącego profilu
- Test: obsługa nieautentykowanego użytkownika
- Test: obsługa błędu bazy danych

---

### Krok 3: Implementacja helper funkcji dla error responses

**Plik:** `src/lib/utils/api-response.ts`

**Funkcjonalność:**
- Helper functions do tworzenia standardowych odpowiedzi błędów
- Consistency w formatowaniu odpowiedzi API

**Implementacja:**
```typescript
import type { ApiErrorResponseDTO } from '../../types';

/**
 * Create a standardized JSON error response
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
 */
export const ErrorResponses = {
  unauthorized: (message: string = 'Missing or invalid authentication token') =>
    createErrorResponse('UNAUTHORIZED', message, 401),
  
  notFound: (message: string = 'Resource not found') =>
    createErrorResponse('NOT_FOUND', message, 404),
  
  internalError: (message: string = 'An unexpected error occurred. Please try again later.') =>
    createErrorResponse('INTERNAL_ERROR', message, 500),
  
  badRequest: (message: string, details?: Record<string, any>) =>
    createErrorResponse('INVALID_INPUT', message, 400, details)
};
```

---

### Krok 4: Implementacja API endpoint

**Plik:** `src/pages/api/profile.ts`

**Funkcjonalność:**
- Endpoint GET /api/profile
- Walidacja autentykacji
- Wywołanie ProfileService
- Obsługa błędów i zwrot odpowiedzi

**Implementacja:**
```typescript
import type { APIRoute } from 'astro';
import { profileService } from '../../lib/services/profile.service';
import { createSuccessResponse, ErrorResponses } from '../../lib/utils/api-response';

/**
 * GET /api/profile
 * 
 * Returns the authenticated user's profile information
 * 
 * @requires Authentication - JWT Bearer token
 * @returns {ProfileDTO} 200 - User profile
 * @returns {ApiErrorResponseDTO} 401 - Unauthorized
 * @returns {ApiErrorResponseDTO} 404 - Profile not found
 * @returns {ApiErrorResponseDTO} 500 - Internal server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Validate authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('GET /api/profile: Missing or invalid Authorization header');
      return ErrorResponses.unauthorized('Missing authentication token');
    }

    // 2. Extract token and create authenticated client
    const token = authHeader.replace('Bearer ', '');
    
    // Create authenticated Supabase client
    const { supabase } = locals;
    const authenticatedClient = locals.supabase.auth.setAuth(token);

    // 3. Fetch profile using service
    const profile = await profileService.getProfile(locals.supabase);

    // 4. Handle not found case
    if (!profile) {
      console.error('GET /api/profile: Profile not found for authenticated user');
      return ErrorResponses.notFound('Profile not found');
    }

    // 5. Return success response
    console.info('GET /api/profile: Success', { userId: profile.id });
    return createSuccessResponse(profile);

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for Supabase auth errors
      if (error.message.includes('JWT') || 
          error.message.includes('token') ||
          error.message.includes('authenticated')) {
        console.warn('GET /api/profile: Authentication error', error.message);
        return ErrorResponses.unauthorized('Invalid or expired authentication token');
      }
    }

    // Log unexpected errors
    console.error('GET /api/profile: Unexpected error', error);

    // Return generic internal error
    return ErrorResponses.internalError();
  }
};
```

**Uwagi:**
- Używamy `locals.supabase` z middleware
- Token JWT jest ekstrahowany z nagłówka i ustawiany w Supabase client
- Wszystkie błędy są logowane dla debugowania
- Klient nie otrzymuje szczegółów wewnętrznych błędów (security)

---

### Krok 5: Aktualizacja middleware (jeśli potrzebne)

**Plik:** `src/middleware/index.ts`

**Sprawdzenie:** Czy middleware poprawnie udostępnia `supabaseClient`

**Obecna implementacja:**
```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**Akcja:** Brak zmian potrzebnych, obecna implementacja jest poprawna.

**Opcjonalna rozbudowa (future):**
- Dodanie logowania requestów
- Dodanie CORS headers
- Dodanie rate limiting

---

### Krok 6: Aktualizacja typów Astro

**Plik:** `src/env.d.ts`

**Sprawdzenie:** Czy `locals.supabase` jest poprawnie otypowany

**Oczekiwana definicja:**
```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import('./db/supabase.client').SupabaseClient;
  }
}
```

**Akcja:** Dodaj definicję `App.Locals` jeśli nie istnieje

---

### Krok 7: Testowanie manualne

**Przygotowanie:**
1. Uruchom dev server: `npm run dev`
2. Zaloguj użytkownika przez Supabase Auth (można użyć Supabase Dashboard do utworzenia test user)
3. Uzyskaj JWT token (z response po logowaniu)

**Test Cases:**

**Test 1: Sukces - pobranie profilu**
```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```
**Expected:** 200 OK + ProfileDTO

**Test 2: Błąd - brak tokena**
```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Content-Type: application/json"
```
**Expected:** 401 Unauthorized

**Test 3: Błąd - nieprawidłowy token**
```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer invalid_token_123" \
  -H "Content-Type: application/json"
```
**Expected:** 401 Unauthorized

**Test 4: Błąd - wygasły token**
- Użyj tokena, który wygasł (starszy niż 1 godzina)
**Expected:** 401 Unauthorized

**Test 5: Sprawdzenie RLS**
- Spróbuj użyć tokena użytkownika A
- Zweryfikuj, że zwrócony profil należy do użytkownika A (nie innego)
**Expected:** 200 OK + profil użytkownika A

---

### Krok 8: Testowanie automatyczne (opcjonalnie dla MVP)

**Framework:** Vitest + Supabase Test Helpers

**Plik testowy:** `src/pages/api/profile.test.ts`

**Test cases:**
- Test: GET /api/profile returns 200 with valid token
- Test: GET /api/profile returns 401 without token
- Test: GET /api/profile returns 401 with invalid token
- Test: GET /api/profile returns 404 if profile doesn't exist
- Test: RLS prevents access to other users' profiles

**Implementacja (example):**
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { GET } from './profile';

describe('GET /api/profile', () => {
  it('should return 401 when no auth token provided', async () => {
    const request = new Request('http://localhost/api/profile');
    const context = { request, locals: { supabase: mockSupabase } };
    
    const response = await GET(context);
    
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  // More tests...
});
```

---

### Krok 9: Dokumentacja API

**Akcja:** Dodaj endpoint do dokumentacji OpenAPI/Swagger (future)

**Plik:** `.ai/api-plan.md` (już istnieje dokumentacja)

**Weryfikacja:** Sprawdź, czy dokumentacja jest aktualna i zgodna z implementacją

---

### Krok 10: Code Review i Linting

**Akcja:**
1. Uruchom linter: `npm run lint`
2. Sprawdź błędy ESLint
3. Popraw wszystkie błędy

**Checklist:**
- [ ] Kod zgodny z regułami ESLint
- [ ] TypeScript types poprawne (brak `any`)
- [ ] Wszystkie importy poprawne
- [ ] Console.log usunięte (zostaw tylko console.error/warn/info)
- [ ] Komentarze JSDoc dla publicznych funkcji
- [ ] Kod czytelny i dobrze zorganizowany

---

### Krok 11: Deployment Preparation

**Pre-deployment checklist:**
- [ ] Environment variables skonfigurowane w production (SUPABASE_URL, SUPABASE_KEY)
- [ ] CORS poprawnie skonfigurowany dla production domain
- [ ] HTTPS wymuszony w production
- [ ] Rate limiting rozważony (future)
- [ ] Monitoring i logging skonfigurowany
- [ ] Database RLS policies enabled i przetestowane

**Deployment:**
1. Merge PR do main branch
2. CI/CD pipeline automatycznie deploy do production (Vercel/Netlify)
3. Smoke test na production environment
4. Monitor error logs w pierwszych 24h

---

### Krok 12: Post-deployment Monitoring

**Metryki do śledzenia:**
- Request count dla GET /api/profile
- Average response time (target: < 200ms P95)
- Error rate (target: < 0.1%)
- 401 vs 404 vs 500 ratio

**Alerty:**
- Error rate > 1%
- P95 latency > 1000ms
- Availability < 99%

**Dashboards:**
- Supabase Dashboard: Database performance
- Application logs: Error tracking
- Future: APM tool dashboard

---

## 10. Kryteria akceptacji (Definition of Done)

Endpoint jest gotowy do production, gdy:

- [ ] **Funkcjonalność:**
  - [ ] GET /api/profile zwraca profil zalogowanego użytkownika
  - [ ] Zwraca 401 dla nieautentykowanych requestów
  - [ ] Zwraca 404 gdy profil nie istnieje
  - [ ] Zwraca 500 dla błędów serwera
  
- [ ] **Bezpieczeństwo:**
  - [ ] JWT token poprawnie weryfikowany
  - [ ] RLS policy działa (użytkownik widzi tylko swój profil)
  - [ ] Błędy nie ujawniają wrażliwych informacji
  
- [ ] **Wydajność:**
  - [ ] P95 latency < 200ms w testach lokalnych
  - [ ] Database query optimized (używa PK index)
  
- [ ] **Kod:**
  - [ ] TypeScript strict mode bez błędów
  - [ ] ESLint passing bez warnings
  - [ ] Kod review approved
  - [ ] Wszystkie importy i typy poprawne
  
- [ ] **Testy:**
  - [ ] Testowanie manualne wykonane (wszystkie test cases passed)
  - [ ] Testy automatyczne napisane (opcjonalnie dla MVP)
  
- [ ] **Dokumentacja:**
  - [ ] Komentarze JSDoc dla publicznych funkcji
  - [ ] API documentation aktualna (api-plan.md)
  - [ ] Implementation plan ukończony (ten dokument)

---

## 11. Przydatne zasoby

### Dokumentacja techniczna
- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Type definitions
- `src/types.ts` - Wszystkie DTOs i typy API
- `src/db/database.types.ts` - Typy generowane z Supabase schema
- `src/db/supabase.client.ts` - Konfiguracja Supabase client

### Przykłady implementacji
- Middleware: `src/middleware/index.ts`
- Database schema: `src/db/db_schema.sql`
- RLS policies: `src/db/db_schema.sql` (sekcja 5)

---

## 12. Notatki implementacyjne

### Potencjalne problemy i rozwiązania

**Problem 1: Supabase client nie uwzględnia tokena z nagłówka**
- **Rozwiązanie:** Użyj `supabase.auth.setAuth(token)` lub stwórz nowy client z custom headers

**Problem 2: RLS policy blokuje dostęp mimo poprawnego tokena**
- **Rozwiązanie:** Sprawdź, czy `auth.uid()` zwraca poprawne user ID w Supabase Dashboard SQL editor

**Problem 3: Endpoint zwraca 404 dla istniejącego użytkownika**
- **Rozwiązanie:** Sprawdź, czy trigger `handle_new_user()` utworzył profil podczas rejestracji

**Problem 4: CORS errors w przeglądarce**
- **Rozwiązanie:** Dodaj odpowiednie CORS headers w response (Astro robi to automatycznie w większości przypadków)

### Best Practices

1. **Zawsze używaj `locals.supabase` zamiast importować `supabaseClient` bezpośrednio**
2. **Loguj błędy z odpowiednim poziomem (info/warn/error)**
3. **Nigdy nie zwracaj wrażliwych informacji w error messages**
4. **Używaj TypeScript strict mode dla lepszej type safety**
5. **Stosuj consistent error response format (ApiErrorResponseDTO)**

### Future Enhancements

- [ ] Implementacja rate limiting (100 req/min per user)
- [ ] Dodanie cache (Redis) dla profili
- [ ] Implementacja API versioning (/api/v1/profile)
- [ ] Dodanie OpenAPI/Swagger documentation endpoint
- [ ] Monitoring i alerting (Sentry integration)
- [ ] Testy automatyczne (Vitest)
- [ ] Performance monitoring (APM tool)

---

**Ostatnia aktualizacja:** 2025-10-13  
**Wersja planu:** 1.0  
**Status:** Ready for implementation

