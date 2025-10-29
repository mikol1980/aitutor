# Plan implementacji widoku Sekcji (Section View)

## 1. Przegląd

Widok Sekcji prezentuje szczegóły wybranego działu (sekcji) oraz listę tematów w ramach tej sekcji, ich status postępu i zależności. Umożliwia uruchomienie testu diagnostycznego dla sekcji oraz nawigację do widoków tematów. Wspiera „soft-lock” tematów z nieukończonymi zależnościami i komunikuje rekomendacje.

Cele:
- Wyświetlenie szczegółów sekcji i listy tematów w kolejności `display_order`.
- Pokazanie statusów postępu i zależności dla tematów (🔒/⚠️/✓ z opisami ARIA).
- CTA do uruchomienia testu diagnostycznego sekcji.
- Spójne stany ładowania/błędów, dostępność WCAG i responsywność.

## 2. Routing widoku

- Ścieżka: `/app/sections/:sectionId`
- SSR przez Astro (layout `src/layouts/Layout.astro`) + hydratacja komponentów React dla interakcji.
- Link do diagnostyki: `/app/sections/:sectionId/diagnostic` (osobny flow, nie w zakresie tego pliku, ale CTA kieruje do tej ścieżki).

## 3. Struktura komponentów

Drzewo (Astro + React):
- `SectionPage` (Astro)
  - `SectionHeader` (React)
  - `DiagnosticBanner` (React)
  - `SectionProgressSummary` (React)
  - `TopicList` (React)
    - `TopicListItem` (React)
      - `DependencyBadge` (React)
      - `TopicStatusIcon` (React)
  - `ErrorState` / `LoadingState` (reuse: `src/components/common`)

Uwagi:
- `SectionPage` pobiera `sectionId` z params, renderuje skeleton i inicjuje hook danych.
- `TopicListItem` wspiera „soft-lock” i akcje nawigacji do `Topic`/`Diagnostic`.

## 4. Szczegóły komponentów

### SectionPage (Astro)
- Opis: Strona kontenerowa. Odpowiada za routing, layout i hydratację komponentów React.
- Główne elementy: `Layout.astro` -> `<main>` -> mount punkt dla `SectionViewApp` (React entry).
- Obsługiwane interakcje: brak (delegacja do React).
- Walidacja: wstępna walidacja `sectionId` (regex UUID v4) – błędy końcowo obsługują API.
- Typy: `SectionDTO`, `SectionProgressResponseDTO`, `TopicListResponseDTO` (backend) + `SectionViewState` (VM).
- Propsy: `{ sectionId: string }` przekazane do `SectionViewApp`.

### SectionViewApp (React – entry)
- Opis: Agreguje dane, zarządza stanem i renderuje pod-komponenty.
- Główne elementy: wrapper, `SectionHeader`, `DiagnosticBanner`, `SectionProgressSummary`, `TopicList`, `ErrorState`/`LoadingState`.
- Interakcje: retry, nawigacje (diagnostyka, temat), rozwijanie zależności.
- Walidacja: stany API, 401 → redirect, 404 → ekran „brak zasobu”, 429 → retry/backoff.
- Typy: `SectionViewState`, `SectionDataVM`.
- Propsy: `{ sectionId: string }`.

### SectionHeader
- Opis: Tytuł sekcji, opis, dodatkowe akcje (np. link powrotu do `/app`).
- Główne elementy: nagłówek, opis, akcje (Shadcn `Button`/`Link`).
- Interakcje: nawigacja wstecz.
- Walidacja: brak.
- Typy: `SectionDTO` | `SectionHeaderVM`.
- Propsy: `{ section: SectionHeaderVM }`.

### DiagnosticBanner
- Opis: Baner informujący o diagnostyce z CTA.
- Główne elementy: ikona/info, tekst, Shadcn `Button`.
- Interakcje: klik „Rozpocznij test diagnostyczny” → push do `/app/sections/:sectionId/diagnostic`.
- Walidacja: sekcja istnieje; brak dodatkowych.
- Typy: `{ sectionId: string }`.
- Propsy: `{ sectionId: string }`.

### SectionProgressSummary
- Opis: Zbiorcze statystyki sekcji (ukończone/w toku/nie rozpoczęte, procent ukończenia).
- Główne elementy: liczby + mini progress bar (Tailwind) lub Shadcn `Progress`.
- Interakcje: tooltipy, aria-label dla liczb.
- Walidacja: brak (wyświetla dane policzone po stronie klienta lub z API).
- Typy: `SectionProgressResponseDTO` → `SectionProgressVM`.
- Propsy: `{ summary: SectionProgressVM }`.

### TopicList
- Opis: Lista tematów posortowanych po `display_order`.
- Główne elementy: lista, opcjonalny filtr/status (MVP: brak filtrów).
- Interakcje: rozwiń zależności (opcjonalnie), kliknięcie itemu → przejście do tematu lub „soft-lock”.
- Walidacja: brak.
- Typy: `TopicItemVM[]`.
- Propsy: `{ topics: TopicItemVM[], onTopicClick: (topic: TopicItemVM) => void }`.

### TopicListItem
- Opis: Pojedynczy wiersz tematu ze statusem, zależnościami, akcjami.
- Główne elementy: tytuł, opis, `TopicStatusIcon`, `DependencyBadge` (liczba, tooltip), akcje.
- Interakcje: klik główny (nawigacja/soft-lock), expand zależności (lazy fetch).
- Walidacja: „soft-lock” gdy `isLocked === true` → pokaż modal z rekomendacjami.
- Typy: `TopicItemVM`.
- Propsy: `{ topic: TopicItemVM, onClick: (topic: TopicItemVM) => void }`.

### DependencyBadge
- Opis: Odznaka liczby zależności i/lub tooltip z listą wymaganych tematów.
- Główne elementy: badge, aria-label.
- Interakcje: hover/focus → tooltip, klik → expand (opcjonalnie ładuje zależności).
- Walidacja: brak.
- Typy: `DependencyVM[]`.
- Propsy: `{ dependenciesCount: number, dependencies?: DependencyVM[] }`.

### TopicStatusIcon
- Opis: Ikona stanu tematu: `not_started` (szary), `in_progress` (żółty), `completed` (zielony).
- Główne elementy: ikona z aria-label.
- Interakcje: tooltip.
- Walidacja: brak.
- Typy: `UserProgressStatus`.
- Propsy: `{ status: UserProgressStatus }`.

## 5. Typy

Nowe typy ViewModel (frontend):

- `SectionHeaderVM`
  - `id: string`
  - `title: string`
  - `description: string | null`

- `DependencyVM`
  - `id: string`
  - `title: string`
  - `sectionId: string`
  - `sectionTitle: string`

- `TopicItemVM`
  - `id: string`
  - `title: string`
  - `description: string | null`
  - `displayOrder: number`
  - `status: UserProgressStatus` (`src/types.ts`)
  - `dependencies?: DependencyVM[]` (opcjonalnie lazy)
  - `dependenciesCount: number`
  - `isLocked: boolean` (true gdy są niespełnione zależności)
  - `lockReason?: string`

- `SectionProgressVM`
  - `totalTopics: number`
  - `completed: number`
  - `inProgress: number`
  - `notStarted: number`
  - `averageScore: number | null`
  - `percentCompleted: number`

- `SectionDataVM`
  - `section: SectionHeaderVM`
  - `summary: SectionProgressVM`
  - `topics: TopicItemVM[]`

- `SectionViewState`
  - `status: "idle" | "loading" | "success" | "error"`
  - `data?: SectionDataVM`
  - `error?: { code?: string; message: string }`

DTO używane z backendu (`src/types.ts`):
- `SectionDTO`, `TopicListResponseDTO`, `SectionProgressResponseDTO`, `TopicDependenciesResponseDTO`, `DiagnosticTestDTO`.

## 6. Zarządzanie stanem

- Custom hook: `useSectionData(sectionId: string)`
  - Cel: pobieranie i scala danych: `GET /api/sections/{id}`, `GET /api/sections/{id}/topics`, `GET /api/sections/{id}/progress`.
  - Strategia: równoległe zapytania, scalenie do `SectionDataVM`.
  - Lazy dependencies: opcjonalny `loadDependencies(topicId)` → `GET /api/topics/{topicId}/dependencies` (z limitem współbieżności i cache w pamięci dla uniknięcia N+1).
  - Stany: `status`, `error`, `data`, `refetch()`.
  - Redirect: na 401 → `/auth/login`; na 404 → stan „brak zasobu”.

- Dodatkowo wykorzystanie istniejącego `useUserProgress` nie jest wymagane (dla sekcji mamy dedykowany endpoint `sections/{id}/progress`). Można jednak użyć go fallbackowo, jeśli sekcyjny endpoint nie jest dostępny.

## 7. Integracja API

Wymagane wywołania:
- `GET /api/sections/{sectionId}` → `SectionDTO`
- `GET /api/sections/{sectionId}/topics` → `TopicListResponseDTO`
- `GET /api/sections/{sectionId}/progress` → `SectionProgressResponseDTO`
- `GET /api/topics/{topicId}/dependencies` → `TopicDependenciesResponseDTO` (lazy)
- `GET /api/sections/{sectionId}/diagnostic-test` (do weryfikacji dostępności przed przejściem – opcjonalnie prefetch)

Nowy klient: `src/lib/api/sections.client.ts`
- `fetchSection(sectionId): Promise<SectionDTO>`
- `fetchSectionTopics(sectionId): Promise<TopicDTO[]>`
- `fetchSectionProgress(sectionId): Promise<SectionProgressResponseDTO>`
- `fetchTopicDependencies(topicId): Promise<TopicDependencyDTO[]>`
- Mapowania DTO → VM:
  - `mapSectionDtoToHeaderVM`
  - `mapProgressDtoToVM` (liczy `percentCompleted`)
  - `composeTopicItemVM(topics, sectionProgress)` → status per topic, `isLocked` jeśli zależności niespełnione (heurystyka: jeśli w dependencies są tematy ze statusem `not_started` lub `in_progress`).

Nagłówki i auth:
- `credentials: 'same-origin'`, `Content-Type: application/json`.
- Obsługa błędów zgodnie z `ApiErrorResponseDTO`.

## 8. Interakcje użytkownika

- Klik „Rozpocznij test diagnostyczny” → nawigacja do `/app/sections/:sectionId/diagnostic`.
- Klik temat:
  - Jeśli `isLocked` → modal „Brak spełnionych zależności” z listą braków i CTA: „Przejdź do rekomendowanego tematu” lub „Uruchom diagnostykę” (linki).
  - Jeśli odblokowany → nawigacja do `/app/topics/:topicId`.
- Hover/focus na `DependencyBadge` → tooltip z listą zależności (lazy load).
- Retry na błąd ładowania → `refetch()`.

Oczekiwane wyniki:
- Prawidłowa nawigacja, jasne komunikaty o stanie blokady, brak twardej blokady (MVP: soft-lock).

## 9. Warunki i walidacja

- `sectionId` musi być UUID (walidacja w API; klient wykonuje minimalny check i obsługuje 400).
- `GET /api/sections/{id}`: 404 → ekran „sekcja nie została znaleziona”.
- `GET /api/sections/{id}/topics`: zamawia listę posortowaną po `display_order` (serwer gwarantuje, UI nie przeporządkowuje bez potrzeby).
- `GET /api/sections/{id}/progress`: prezentuje statusy; UI dodaje `percentCompleted`.
- `GET /api/topics/{id}/dependencies`: używany tylko do prezentacji (tooltip/expand), weryfikacja miękka.
- 401 → redirect do `/auth/login` (globalny middleware) i informacja.
- 429 → UI: komunikat z `retry_after` i opóźniony retry.

## 10. Obsługa błędów

- Wzorzec błędów: korzystać z `ErrorState` i toasta (Shadcn) z treściami przyjaznymi dla użytkownika.
- Scenariusze:
  - Brak sieci → placeholder i przycisk „Spróbuj ponownie”.
  - 404 sekcji → komunikat i link powrotu do `/app`.
  - 500/DB timeout → komunikat „Spróbuj ponownie później” + `refetch()`.
  - Nieudane lazy dependencies → badge pokazuje licznik, tooltip informuje o problemie i proponuje retry.

Logowanie (dev): `console.info/warn/error` zgodnie ze standardem w API, bez wrażliwych danych.

## 11. Kroki implementacji

1. Routing i szkielet strony
   - Utwórz `src/pages/app/sections/[sectionId].astro` z `Layout.astro` i mountpointem dla `SectionViewApp`.
   - Dodaj meta/ARIA landmarki.

2. Klient API sekcji
   - Dodaj `src/lib/api/sections.client.ts` z funkcjami: `fetchSection`, `fetchSectionTopics`, `fetchSectionProgress`, `fetchTopicDependencies` i mapowaniami DTO→VM.

3. Typy widoku
   - Dodaj `src/lib/types/section-view.types.ts` z VM: `SectionHeaderVM`, `DependencyVM`, `TopicItemVM`, `SectionProgressVM`, `SectionDataVM`, `SectionViewState`.

4. Hook danych
   - Dodaj `src/hooks/useSectionData.ts`: równoległe pobieranie 3 endpointów, scalanie do `SectionDataVM`, `refetch`, lazy `loadDependencies` z cache i limitem współbieżności.

5. Komponenty UI
   - Dodaj `SectionViewApp.tsx`, `SectionHeader.tsx`, `DiagnosticBanner.tsx`, `SectionProgressSummary.tsx`, `TopicList.tsx`, `TopicListItem.tsx`, `DependencyBadge.tsx`, `TopicStatusIcon.tsx` w `src/components/section/`.
   - Użyj Shadcn/ui (`Button`, `Badge`, `Tooltip`, `Dialog`, `Progress`).

6. Dostępność i responsywność
   - Dodaj aria-labels, role, focus management, kontrasty. Tailwind 4, mobile-first.

7. Stany i błędy
   - Wykorzystaj `LoadingState`/`ErrorState`. Obsłuż 401/404/429/500. Dodaj retry/backoff.

8. Integracja nawigacji
   - Linki do `/app/topics/:topicId` i `/app/sections/:sectionId/diagnostic`.

9. Testy ręczne i regresja
   - Scenariusze: brak sekcji (404), sekcja bez tematów, sekcja z tematami i zależnościami, offline, rate limit.

10. Optymalizacja
   - Cache w pamięci dla dependencies, memoizacja listy, uniknięcie niepotrzebnych re-renderów, lazy tooltips.

11. Dokumentacja
   - Krótki README w `src/components/section/` z zasadami korzystania i mapowaniem typów.

---

Zgodność z PRD i user stories:
- Pokazuje listę tematów, statusy i zależności, oraz CTA do diagnostyki (US-004; UI plan 2.4, 2.5).
- Wspiera zasady dostępności, spójne stany UI i bezpieczeństwo (UI plan sekcje 1, 2, 4, 6, 7).
