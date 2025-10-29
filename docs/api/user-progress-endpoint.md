# User Progress Endpoint

Endpoint do pobierania podsumowania postępów użytkownika w nauce.

## Endpoint

```
GET /api/user-progress
```

## Opis

Zwraca szczegółowy przegląd postępów uwierzytelnionego użytkownika we wszystkich tematach, wraz z podsumowaniem statystyk. Endpoint wspiera opcjonalne filtrowanie po sekcji i statusie postępu.

## Autoryzacja

**Wymagana:** Tak

Endpoint wymaga aktywnej sesji użytkownika. Sesja jest zarządzana przez middleware za pomocą cookies (`sb-access-token`, `sb-refresh-token`).

## Parametry Query

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `section_id` | UUID | Nie | Filtruje postępy tylko dla wybranej sekcji |
| `status` | enum | Nie | Filtruje po statusie: `not_started`, `in_progress`, `completed` |

## Odpowiedzi

### 200 OK - Sukces

Zwraca obiekt zawierający tablicę szczegółowych postępów i podsumowanie statystyk.

**Struktura odpowiedzi:**

```typescript
{
  progress: UserProgressWithDetailsDTO[];
  summary: UserProgressSummaryDTO;
}
```

**UserProgressWithDetailsDTO:**
```typescript
{
  user_id: string;        // UUID użytkownika
  section_id: string;     // UUID sekcji
  section_title: string;  // Tytuł sekcji (np. "Algebra")
  topic_id: string;       // UUID tematu
  topic_title: string;    // Tytuł tematu (np. "Równania liniowe")
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;   // Wynik w zakresie 0.0-1.0 lub null
  updated_at: string | null; // ISO timestamp ostatniej aktualizacji
}
```

**UserProgressSummaryDTO:**
```typescript
{
  total_topics: number;   // Łączna liczba tematów
  completed: number;      // Liczba ukończonych tematów
  in_progress: number;    // Liczba tematów w trakcie
  not_started: number;    // Liczba nieotwartych tematów
}
```

**Przykład odpowiedzi:**

```json
{
  "progress": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "section_id": "660e8400-e29b-41d4-a716-446655440111",
      "section_title": "Algebra",
      "topic_id": "770e8400-e29b-41d4-a716-446655440222",
      "topic_title": "Równania liniowe",
      "status": "completed",
      "score": 0.85,
      "updated_at": "2025-10-13T12:45:00Z"
    },
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "section_id": "660e8400-e29b-41d4-a716-446655440111",
      "section_title": "Algebra",
      "topic_id": "770e8400-e29b-41d4-a716-446655440333",
      "topic_title": "Równania kwadratowe",
      "status": "in_progress",
      "score": 0.65,
      "updated_at": "2025-10-14T10:20:00Z"
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

### 400 Bad Request - Błędne parametry

Zwraca błąd walidacji gdy parametry query są nieprawidłowe.

**Przykład:**

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "section_id musi być poprawnym UUID"
  }
}
```

### 401 Unauthorized - Brak autoryzacji

Zwraca błąd gdy użytkownik nie jest zalogowany lub sesja wygasła.

**Przykład:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Brak aktywnej sesji. Zaloguj się ponownie."
  }
}
```

### 500 Internal Server Error - Błąd serwera

Zwraca błąd gdy wystąpi nieoczekiwany problem po stronie serwera.

**Przykład:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Błąd połączenia z bazą danych. Spróbuj ponownie później."
  }
}
```

## Przykłady użycia

### Pobranie wszystkich postępów

```bash
curl -X GET 'http://localhost:3000/api/user-progress' \
  -H 'Cookie: sb-access-token=YOUR_ACCESS_TOKEN'
```

### Filtrowanie po sekcji

```bash
curl -X GET 'http://localhost:3000/api/user-progress?section_id=660e8400-e29b-41d4-a716-446655440111' \
  -H 'Cookie: sb-access-token=YOUR_ACCESS_TOKEN'
```

### Filtrowanie po statusie

```bash
curl -X GET 'http://localhost:3000/api/user-progress?status=completed' \
  -H 'Cookie: sb-access-token=YOUR_ACCESS_TOKEN'
```

### Kombinacja filtrów

```bash
curl -X GET 'http://localhost:3000/api/user-progress?section_id=660e8400-e29b-41d4-a716-446655440111&status=in_progress' \
  -H 'Cookie: sb-access-token=YOUR_ACCESS_TOKEN'
```

## Bezpieczeństwo

### Row Level Security (RLS)

Endpoint wykorzystuje polityki RLS Supabase, które automatycznie filtrują wyniki do danych należących do zalogowanego użytkownika. Użytkownik może zobaczyć **wyłącznie swoje** postępy.

### Walidacja

Wszystkie parametry query są walidowane przez schemat Zod:
- `section_id` - musi być prawidłowym UUID
- `status` - musi być jedną z wartości: `not_started`, `in_progress`, `completed`

## Implementacja

### Serwis

Logika biznesowa znajduje się w [src/lib/services/progress.service.ts](../../src/lib/services/progress.service.ts):

```typescript
const { progress, summary } = await progressService.getUserProgressOverview(
  supabase,
  { sectionId, status }
);
```

### API Route

Handler endpointu: [src/pages/api/user-progress/index.ts](../../src/pages/api/user-progress/index.ts)

### Typy

Wszystkie typy DTO zdefiniowane w [src/types.ts](../../src/types.ts):
- `UserProgressWithDetailsDTO`
- `UserProgressSummaryDTO`
- `UserProgressOverviewResponseDTO`

## Testowanie

### Automatyczne testy

Skrypt testowy dostępny w głównym katalogu projektu:

```bash
# Ustaw token dostępu
export SUPABASE_ACCESS_TOKEN='your-token-here'

# Uruchom testy
bash test-user-progress-endpoint.sh
```

Skrypt testuje:
- ✓ Żądanie bez autoryzacji (401)
- ✓ Żądanie autoryzowane bez filtrów (200)
- ✓ Nieprawidłowy section_id (400)
- ✓ Nieprawidłowy status (400)
- ✓ Poprawne filtrowanie po statusie (200)

### Manualne testowanie

1. Uruchom dev server:
```bash
npm run dev
```

2. Zaloguj się przez przeglądarkę

3. Pobierz token z cookies przeglądarki (`sb-access-token`)

4. Wykonaj zapytania przez curl/Postman

## Baza danych

### Tabele

Endpoint wykorzystuje następujące tabele:
- `user_progress` - postępy użytkowników
- `topics` - tematy edukacyjne
- `sections` - sekcje (działy)

### Zapytanie

```sql
SELECT
  up.user_id,
  up.topic_id,
  up.status,
  up.score,
  up.updated_at,
  t.id,
  t.title,
  s.id,
  s.title
FROM user_progress up
INNER JOIN topics t ON up.topic_id = t.id
INNER JOIN sections s ON t.section_id = s.id
WHERE up.user_id = auth.uid()
  AND (t.section_id = $1 OR $1 IS NULL)
  AND (up.status = $2 OR $2 IS NULL);
```

### RLS Policy

```sql
-- Użytkownicy mogą odczytać tylko swoje postępy
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);
```

## Wydajność

### Optymalizacje

- **Inner Joins**: Zapewniają, że zwracane są tylko kompletne rekordy
- **Client-side aggregation**: Statystyki summary liczone z pobranych danych (1 zapytanie zamiast 2)
- **RLS**: Filtrowanie na poziomie bazy danych
- **Indeksy**: Automatyczne indeksy na kluczach obcych

### Cache

Obecnie brak cache'owania. W przyszłości rozważyć:
- Redis cache z TTL 5-10 minut
- Invalidacja przy aktualizacji postępu
- Cache per user + filtry

## Powiązane endpointy

- `GET /api/sections/{id}/progress` - Postępy w konkretnej sekcji
- `GET /api/user-progress/{topicId}` - Postęp w konkretnym temacie
- `PUT /api/user-progress/{topicId}` - Aktualizacja postępu

## Historia zmian

- **2025-10-29**: Utworzenie endpointu - wersja 1.0
