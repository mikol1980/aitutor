# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard (ścieżka aplikacji po zalogowaniu) prezentuje:
- listę działów (Sekcji) zgodnych z programem matury z krótkim opisem i wskaźnikiem postępu,
- skróty: „Kontynuuj ostatnią sesję” (jeśli istnieje) oraz „Rekomendowany następny temat”,
- szybki dostęp do profilu/ustawień.

Cele funkcjonalne:
- Szybkie wejście w naukę od miejsca, w którym uczeń skończył (ostatnia sesja),
- Przegląd sekcji i stanu realizacji,
- Punkt startowy do rozpoczęcia nowego działu (test diagnostyczny w widoku Sekcji), zgodnie z US-004.

UX i dostępność:
- Skeletony ładowania, duże cele dotykowe, wysoki kontrast, stan „brak danych”,
- Tylko dla użytkownika uwierzytelnionego (SSR guard),
- Responsywność mobile-first.

## 2. Routing widoku

- Ścieżka: `/app`
- Plik strony: `src/pages/app/dashboard.astro` (SSR – sprawdza sesję; przekierowuje na `/auth/login` gdy brak)
- Hydratacja React (island): `DashboardScreen` montowany w `dashboard.astro` dla interakcji i pobierania danych.

## 3. Struktura komponentów

Drzewo komponentów (wysoki poziom):

```
DashboardPage (Astro) - src/pages/app/dashboard.astro
└─ DashboardScreen (React) - src/components/dashboard/DashboardScreen.tsx
   ├─ ShortcutsPanel
   │  ├─ ContinueLastSessionTile
   │  └─ RecommendedNextTopicTile
   ├─ SectionsGrid
   │  ├─ SectionCard*
   │  └─ ... (N kart)
   ├─ LoadingSkeletons
   └─ ErrorState / EmptyState
```

## 4. Szczegóły komponentów

### DashboardPage (Astro)
- Opis: Strona SSR realizująca guard uwierzytelnienia i renderująca layout. Montuje wyspę React `DashboardScreen`.
- Główne elementy: `<Layout>`, `<main>`, kontener treści, mountpoint dla React.
- Obsługiwane interakcje: brak (delegowane do `DashboardScreen`).
- Walidacja: jeśli brak sesji – redirect do `/auth/login` (już istnieje w pliku).
- Typy: brak bezpośrednio.
- Propsy: brak.

### DashboardScreen
- Opis: Kontener logiki pobierający dane (`/api/sections`, `/api/user-progress`, opcjonalnie walidujący ostatnią sesję po `localStorage` przez `/api/sessions/{id}`), kompozycja UI z `ShortcutsPanel` i `SectionsGrid`.
- Główne elementy: wrapper, `ShortcutsPanel`, `SectionsGrid`, `LoadingSkeletons`, `ErrorState`.
- Obsługiwane interakcje:
  - Inicjalne pobranie danych (React Query): sekcje, postęp użytkownika;
  - Walidacja i prezentacja „Kontynuuj ostatnią sesję” na podstawie `localStorage` → GET `/api/sessions/{id}`;
  - Kliknięcia: na kartę Sekcji (nawigacja do `/app/sections/[sectionId]`), na skrót sesji (nawigacja do `/app/sessions/[sessionId]`), do profilu `/app/profile`.
- Walidacja: UUID `lastSessionId` (regex/`isUuid`), spójność danych sekcji i progresu.
- Typy: `SectionListResponseDTO`, `UserProgressOverviewResponseDTO`, `SessionDetailsDTO`, VM-y z rozdz. 5.
- Propsy: brak (kontener najwyższego rzędu w ramach widoku).

### ShortcutsPanel
- Opis: Sekcja skrótów z dwoma kaflami: ostatnia sesja i rekomendowany temat.
- Główne elementy: grid dwóch kart (`ContinueLastSessionTile`, `RecommendedNextTopicTile`).
- Obsługiwane interakcje: przejście do sesji/tematu.
- Walidacja: kafle warunkowe – ukryte, gdy brak danych lub walidacja się nie powiodła.
- Typy: `LastSessionVM`, `RecommendedTopicVM`.
- Propsy: `{ lastSession?: LastSessionVM; recommended?: RecommendedTopicVM }`.

### ContinueLastSessionTile
- Opis: Kafelek skrótu do ostatniej sesji. Źródło: `localStorage.lastSessionId` ustawiane przez widok Sesji; walidowane przez GET `/api/sessions/{id}`.
- Główne elementy: `Card` z tytułem tematu, datą i CTA.
- Obsługiwane interakcje: klik → `/app/sessions/{id}`.
- Walidacja: `lastSessionId` musi być UUID; odpowiedź 200 z `/api/sessions/{id}`; w przeciwnym razie kafel ukryty.
- Typy: `LastSessionVM`.
- Propsy: `{ session: LastSessionVM }`.

### RecommendedNextTopicTile
- Opis: Kafelek wskazujący kolejny rekomendowany temat. Heurystyka klienta: wybór pierwszego tematu ze statusem `not_started` w sekcji o najwyższym udziale nieukończonych tematów (na podstawie `progress`).
- Główne elementy: `Card` z nazwą sekcji/tematu, krótkim opisem, CTA „Przejdź”.
- Obsługiwane interakcje: klik → `/app/sections/[sectionId]` (lub w przyszłości bezpośrednio start tematu).
- Walidacja: temat musi istnieć w danych postępu; jeśli brak – kafel ukryty.
- Typy: `RecommendedTopicVM`.
- Propsy: `{ recommendation: RecommendedTopicVM }`.

### SectionsGrid
- Opis: Lista kart Sekcji; dane łączone z postępem dla wskaźnika progresu.
- Główne elementy: grid kart; responsywny układ (1 kol. mobile, 2–3 desktop).
- Obsługiwane interakcje: klik na `SectionCard` → `/app/sections/[sectionId]`.
- Walidacja: brak sekcji → `EmptyState`.
- Typy: `DashboardSectionVM[]`.
- Propsy: `{ sections: DashboardSectionVM[] }`.

### SectionCard
- Opis: Karta pojedynczej sekcji z nazwą, opisem i wskaźnikiem postępu.
- Główne elementy: `Card`, `Progress`, `Badge` z liczbami ukończonych/in progress.
- Obsługiwane interakcje: klik → `/app/sections/[sectionId]`.
- Walidacja: identyfikator sekcji musi być UUID; liczby progresu ≥ 0.
- Typy: `DashboardSectionVM`.
- Propsy: `{ section: DashboardSectionVM }`.

### LoadingSkeletons
- Opis: Skeletony dla kafli skrótów i siatki sekcji.
- Główne elementy: `Skeleton` (z shadcn/ui), placeholdery progress barów.
- Obsługiwane interakcje: brak.
- Walidacja: brak.
- Typy: brak.
- Propsy: brak.

### ErrorState / EmptyState
- Opis: Komponenty stanów błędu i pustki.
- Główne elementy: ikony/komunikaty, przycisk „Spróbuj ponownie”.
- Obsługiwane interakcje: retry → refetch React Query.
- Walidacja: brak.
- Typy: opcjonalnie `ApiErrorUiModel` (spójny z sesją).
- Propsy: `{ message?: string; onRetry?: () => void }`.

## 5. Typy

DTO z backendu (z `src/types.ts`):
- `SectionListResponseDTO`: `{ sections: SectionDTO[] }`
- `SectionDTO`: `{ id: string; title: string; description: string|null; display_order: number; created_at: string }`
- `UserProgressOverviewResponseDTO`: `{ progress: UserProgressWithDetailsDTO[]; summary: UserProgressSummaryDTO }`
- `UserProgressWithDetailsDTO`: `{ user_id: string; section_id: string; section_title: string; topic_id: string; topic_title: string; status: 'not_started'|'in_progress'|'completed'; score: number|null; updated_at: string|null }`
- `SessionDetailsDTO`: `SessionEntity & { topic_title: string|null }`

Nowe ViewModel-e (frontend):
- `DashboardSectionVM`
  - `id: string` (UUID)
  - `title: string`
  - `description: string | null`
  - `progress: { completed: number; inProgress: number; notStarted: number; percentCompleted: number }`
- `LastSessionVM`
  - `id: string` (UUID)
  - `topicTitle: string | null`
  - `endedAt: string | null`
  - `isActive: boolean` (pochodna: `endedAt === null`)
- `RecommendedTopicVM`
  - `sectionId: string`
  - `sectionTitle: string`
  - `topicId: string`
  - `topicTitle: string`
- `DashboardDataVM`
  - `sections: DashboardSectionVM[]`
  - `lastSession?: LastSessionVM`
  - `recommended?: RecommendedTopicVM`

Mapowania:
- `SectionListResponseDTO.sections` + `UserProgressOverviewResponseDTO.progress` → `DashboardSectionVM[]` (agregacja po `section_id`).
- `SessionDetailsDTO` → `LastSessionVM`.
- Heurystyka z `progress` → `RecommendedTopicVM`.

## 6. Zarządzanie stanem

- Biblioteka: React Query (TanStack Query) dla pobrań i cache.
- Klucze i cache:
  - `['sections']`: GET `/api/sections` – `staleTime: 3600_000` (1h), `cacheTime: 3600_000`.
  - `['user-progress','overview']`: GET `/api/user-progress` – `staleTime: 60_000`.
  - `['sessions','validate', lastSessionId]`: GET `/api/sessions/{id}` – `enabled: !!lastSessionId`, `staleTime: 300_000`.
- Lokalne źródła:
  - `localStorage.lastSessionId` – ustawiane w widoku Sesji; tu tylko odczyt i walidacja.
- Niestandardowe hooki:
  - `useDashboardData()` – kapsułkuje 3 zapytania, łączy sekcje z progresem, liczy agregaty, zwraca VM-y i stany (loading/error/empty).
  - `useRecommendedTopic(progress)` – zwraca `RecommendedTopicVM | undefined` wg heurystyki.

## 7. Integracja API

- GET `/api/sections`
  - Request: brak body; cookies sesji (SSR/middleware)
  - Response: `SectionListResponseDTO`
  - Błędy: 401 (brak sesji), 500

- GET `/api/user-progress`
  - Request: opcjonalnie `?section_id`, `?status` (na Dashboard – bez filtrów)
  - Response: `UserProgressOverviewResponseDTO`
  - Błędy: 400 (złe query), 401, 500

- GET `/api/sessions/{id}` (walidacja ostatniej sesji)
  - Request: `{id: UUID}`
  - Response: `SessionDetailsDTO`
  - Błędy: 400, 401, 403, 404, 500 – ukryj kafel przy 403/404; pokaż retry przy 5xx

## 8. Interakcje użytkownika

- Kliknięcie „Kontynuuj ostatnią sesję” → nawigacja do `/app/sessions/{id}`.
- Kliknięcie „Rekomendowany temat” → przejście do `/app/sections/[sectionId]` (użytkownik może rozpocząć diagnostykę w tym widoku).
- Kliknięcie karty Sekcji → `/app/sections/[sectionId]`.
- Link „Profil” → `/app/profile`.

Mapowanie do User Story (US-004):
- Kryterium 1 (lista działów) → `SectionsGrid` + GET `/api/sections`.
- Kryterium 2 (informacja o teście diagnostycznym po wyborze działu) → realizowane w widoku Sekcji; Dashboard przekierowuje po kliknięciu karty.
- Kryterium 3 (test 3–5 pytań) → poza zakresem tego widoku; nawigacja zapewniona.
- Kryterium 4 (propozycja pierwszego tematu) → kafel „Rekomendowany temat” oparty o `progress` (heurystyka klienta) – wstępna integracja.

## 9. Warunki i walidacja

- Uwierzytelnienie: wymuszone przez SSR guard w `dashboard.astro`.
- `lastSessionId`: musi być poprawnym UUID (walidacja po stronie klienta); przy niepowodzeniu – ukryj kafel.
- Spójność danych: sekcje bez progresu → progres = 0; brak sekcji → `EmptyState`.
- Błędy 401/403/404 z `/api/sessions/{id}` → nie blokują całego widoku, jedynie skrót sesji.

## 10. Obsługa błędów

- Sieć/500: `ErrorState` z przyciskiem „Spróbuj ponownie” (refetch RQ) dla sekcji/progresu.
- Częściowe błędy: prezentuj dostępne sekcje nawet gdy progres niedostępny; wskaźnik postępu pokazuje stan nieznany („–”).
- Brak danych: komunikat „Brak sekcji do wyświetlenia”/„Brak rekomendacji na teraz”.
- Telemetria: console.info/warn zgodnie z istniejącą konwencją.

## 11. Kroki implementacji

1) Astro/SSR:
   - Upewnij się, że `src/pages/app/dashboard.astro` zawiera guard sesji (jest) i montuje `DashboardScreen` (React island, `client:load`).

2) Struktura plików:
   - `src/components/dashboard/DashboardScreen.tsx`
   - `src/components/dashboard/ShortcutsPanel.tsx`
   - `src/components/dashboard/ContinueLastSessionTile.tsx`
   - `src/components/dashboard/RecommendedNextTopicTile.tsx`
   - `src/components/dashboard/SectionsGrid.tsx`
   - `src/components/dashboard/SectionCard.tsx`
   - `src/components/common/LoadingSkeletons.tsx` (lub reużyć istniejące)
   - `src/components/common/ErrorState.tsx`

3) Typy i mapery:
   - Dodaj VM-y z rozdz. 5 w `src/lib/types/dashboard-view.types.ts`.
   - Napisz funkcje mapujące: `mapSectionsAndProgressToDashboardVM(sectionsDto, progressDto)`.

4) Hooki i RQ:
   - `useDashboardData()` łączący zapytania i zwracający `DashboardDataVM` + stany.
   - `useRecommendedTopic(progress)`.

5) Integracje API:
   - Klient: funkcje fetch dla `/api/sections`, `/api/user-progress`, reużyj istniejącego klienta sesji dla GET `/api/sessions/{id}` (jeśli potrzebne – prosty fetch + parser błędów spójny z `sessions.client.ts`).

6) UI/Komponenty:
   - Zaimplementuj `ShortcutsPanel` (pobiera `lastSessionId` z `localStorage`, waliduje przez RQ, renderuje warunkowo oba kafle).
   - Zaimplementuj `SectionsGrid` i `SectionCard` (progress obliczany z `progressDto`).
   - Dodaj skeletony i stany błędów.

7) Nawigacja i dostępność:
   - Linki do `/app/sessions/{id}`, `/app/sections/[sectionId]`, `/app/profile`.
   - ARIA: landmarki, `aria-busy` podczas ładowania, focus management po error/empty.

8) Testy manualne scenariuszy:
   - Brak `lastSessionId` w `localStorage`.
   - `lastSessionId` niepoprawny/403/404.
   - Brak progresu; brak sekcji; częściowa dostępność danych.
   - Wolna sieć (skeletony, retry).

9) Optymalizacje:
   - `staleTime` dla sekcji 1h (wymóg cache 1h), progres 1 min.
   - Memory leak audit (anulowanie żądań przy unmount RQ).

10) Stylowanie (Tailwind + shadcn/ui):
   - Użyj `Card`, `Button`, `Skeleton`, `Badge`, `Progress`.
   - Zapewnij responsywne przerwy siatki i duże hit-targets.


