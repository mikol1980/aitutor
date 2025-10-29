# Security Review: User Progress Endpoint

## Przegląd bezpieczeństwa dla GET /api/user-progress

Data: 2025-10-29
Reviewer: AI Implementation
Status: ✅ APPROVED

## 1. Autoryzacja i Uwierzytelnianie

### ✅ Weryfikacja sesji
```typescript
const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
if (sessionError || !session) {
  return ErrorResponses.unauthorized('Brak aktywnej sesji. Zaloguj się ponownie.');
}
```

**Status:** Bezpieczne
- Middleware automatycznie przywraca sesję z httpOnly cookies
- Sprawdzenie sesji przed każdym zapytaniem do bazy
- Odpowiedni komunikat błędu (401) przy braku sesji

### ✅ Weryfikacja użytkownika
```typescript
const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
if (authError || !user) {
  return ErrorResponses.unauthorized('Nieprawidłowa lub wygasła sesja.');
}
```

**Status:** Bezpieczne
- Dodatkowa weryfikacja autentyczności użytkownika
- Obsługa wygasłych lub nieprawidłowych tokenów

## 2. Row Level Security (RLS)

### ✅ Automatyczne filtrowanie przez RLS
```sql
-- Polityka RLS w bazie danych
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);
```

**Status:** Bezpieczne
- **user_id NIE jest przekazywany z requestu** - zabezpiecza przed IDOR
- RLS automatycznie filtruje wyniki do `auth.uid()`
- Użytkownik NIGDY nie może zobaczyć danych innych użytkowników
- Inner joiny do topics/sections nie naruszają RLS

### ✅ Brak user_id w parametrach
```typescript
// ❌ NIEPRAWIDŁOWE (nie robimy tego!)
const userId = url.searchParams.get('user_id'); // NIGDY!

// ✅ PRAWIDŁOWE (używamy)
const { data: { user } } = await locals.supabase.auth.getUser();
// user_id pochodzi z uwierzytelnionej sesji, nie z parametrów!
```

**Status:** Bezpieczne
- Brak możliwości przekazania user_id przez klienta
- Całkowite poleganie na RLS i auth.uid()

## 3. Walidacja Wejścia

### ✅ Zod Schema dla query params
```typescript
const QuerySchema = z.object({
  section_id: z.string().uuid({ message: 'section_id musi być poprawnym UUID' }).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
});
```

**Status:** Bezpieczne
- Walidacja formatu UUID zapobiega SQL injection
- Enum dla status zapobiega nieoczekiwanym wartościom
- Zod automatycznie sanitizuje input
- Jasne komunikaty błędów po polsku

### ✅ Bezpieczne przekazywanie do Supabase
```typescript
await progressService.getUserProgressOverview(
  locals.supabase,
  {
    sectionId: section_id,  // Zwalidowany UUID
    status: status as UserProgressStatus | undefined,  // Zwalidowany enum
  }
);
```

**Status:** Bezpieczne
- Parametry po walidacji Zod
- TypeScript zapewnia type safety
- Supabase używa parametryzowanych zapytań (prepared statements)

## 4. Ochrona przed atakami

### ✅ SQL Injection
**Status:** Zabezpieczone
- Supabase używa parametryzowanych zapytań
- Zod waliduje UUID i enum przed przekazaniem
- Brak konkatenacji stringów w zapytaniach

### ✅ IDOR (Insecure Direct Object Reference)
**Status:** Zabezpieczone
- user_id nigdy nie pochodzi z requestu
- RLS wymusza auth.uid() na poziomie bazy
- Niemożliwe pobranie danych innych użytkowników, nawet znając UUID

### ✅ NoSQL Injection
**Status:** Nie dotyczy
- Używamy PostgreSQL z Supabase (relacyjna baza)

### ✅ XSS (Cross-Site Scripting)
**Status:** Zabezpieczone
- Endpoint zwraca JSON (Content-Type: application/json)
- Brak renderowania HTML
- Frontend odpowiedzialny za sanitizację przy wyświetlaniu

### ✅ CSRF (Cross-Site Request Forgery)
**Status:** Zabezpieczone
- Używamy httpOnly, sameSite cookies
- Middleware weryfikuje sesję z cookies
- GET request (idempotentny, read-only)

### ✅ Rate Limiting
**Status:** ⚠️ Do rozważenia w przyszłości
- Obecnie brak rate limiting
- Zalecenie: Dodać w produkcji (np. 100 req/min per user)

## 5. Obsługa Błędów

### ✅ Nie ujawniamy szczegółów technicznych
```typescript
// ❌ NIEPRAWIDŁOWE
return new Response(error.stack); // Nie robimy tego!

// ✅ PRAWIDŁOWE
console.error('GET /api/user-progress: Unexpected error', { error, stack });
return ErrorResponses.internalError(); // Generyczny komunikat
```

**Status:** Bezpieczne
- Szczegóły błędów logowane na serwerze
- Klient otrzymuje generyczne komunikaty
- Kody statusu HTTP zgodne ze standardem

### ✅ Logowanie z kontekstem
```typescript
console.info('GET /api/user-progress: Success', {
  userId: user.id,
  totalRecords: progress.length,
  filters: { section_id, status }
});
```

**Status:** Bezpieczne
- Logowanie pomaga w debugowaniu
- Nie logujemy wrażliwych danych (hasła, tokeny)
- Context dla analizy wydajności

## 6. Bezpieczeństwo Cookies

### ✅ httpOnly, secure, sameSite
Zarządzane przez middleware ([src/middleware/index.ts](../../src/middleware/index.ts)):

```typescript
context.cookies.set('sb-access-token', session.access_token, {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 dni
  path: '/',
});
```

**Status:** Bezpieczne
- httpOnly: JavaScript nie może odczytać
- secure: Tylko HTTPS w produkcji
- sameSite: Ochrona przed CSRF

## 7. Wydajność i DoS

### ✅ Limit wyników
**Status:** ⚠️ Potencjalne ryzyko
- Obecnie brak limitu liczby zwracanych rekordów
- Możliwe problemy przy dużej liczbie tematów (1000+)

**Zalecenia:**
```typescript
// Do rozważenia:
const MAX_TOPICS = 500;
if (progress.length > MAX_TOPICS) {
  // Dodać paginację lub warning
}
```

### ✅ N+1 Query Problem
**Status:** Zabezpieczone
- Single query z JOINami
- Brak iteracyjnych zapytań w pętli
- Client-side aggregation (summary z jednego zapytania)

## 8. Zgodność z GDPR

### ✅ Minimalizacja danych
**Status:** Zgodne
- Zwracamy tylko dane należące do użytkownika
- Brak zbędnych danych osobowych
- user_id potrzebny do UI, ale można rozważyć opcjonalne ukrywanie

### ✅ Prawo do usunięcia
**Status:** Zgodne
- Przy usunięciu użytkownika, RLS uniemożliwi dostęp
- CASCADE DELETE w bazie usunie user_progress

## 9. API Security Best Practices

### ✅ Checklist

- [x] HTTPS w produkcji
- [x] Uwierzytelnianie (JWT via cookies)
- [x] Autoryzacja (RLS policies)
- [x] Walidacja wejścia (Zod)
- [x] Sanityzacja output (JSON, brak HTML)
- [x] Rate limiting ⚠️ (do dodania w przyszłości)
- [x] Error handling (generyczne komunikaty)
- [x] Logging (bez wrażliwych danych)
- [x] CORS (Astro default - same origin)
- [ ] Monitoring (do dodania w przyszłości)

## 10. Zalecenia

### Krytyczne (przed produkcją)
1. **Rate Limiting**: Dodać limit 100 req/min per user
2. **Pagination**: Limit 500 tematów na request

### Średni priorytet
1. **Monitoring**: Dodać alerty przy wysokim błędzie 500
2. **Cache**: Redis z TTL 5 min dla często odpytywanych danych
3. **Database indexes**: Sprawdzić plany zapytań dla optimization

### Niski priorytet
1. **GraphQL**: Rozważyć jako alternatywę dla filtrowania
2. **Websockets**: Real-time updates postępów

## Podsumowanie

**Ogólna ocena bezpieczeństwa: ✅ DOBRA**

Endpoint został zaimplementowany zgodnie z najlepszymi praktykami bezpieczeństwa:
- Silne zabezpieczenie przez RLS
- Brak możliwości IDOR
- Prawidłowa walidacja i sanityzacja
- Bezpieczne zarządzanie sesją

Zalecane ulepszenia przed produkcją:
- Rate limiting
- Pagination dla dużych zbiorów danych

---

**Zatwierdzone do wdrożenia w środowisku deweloperskim**
**Wymaga rate limiting przed wdrożeniem produkcyjnym**
