## Plan implementacji widoku Profil

## 1. Przegląd
Widok profilu i ustawień służy do prezentacji danych konta (login, email, status ukończenia tutoriala) oraz do zarządzania lokalnymi preferencjami UI (motyw: jasny/ciemny/system, audio: włącz/wyłącz). Dane profilu są pobierane z zabezpieczonego endpointu `GET /api/profile` (JWT Bearer), zaś preferencje UI są przechowywane lokalnie po stronie klienta (brak wrażliwych danych).

## 2. Routing widoku
- Ścieżka: `/app/profile`
- Plik strony: `src/pages/app/profile.astro`
- Layout: `src/layouts/Layout.astro`
- Hydratacja React (island) dla interakcji w czasie rzeczywistym

## 3. Struktura komponentów
Drzewo komponentów (wysokopoziomowo):

- `ProfilePage` (Astro)
  - `ProfileScreen` (React island)
    - `ProfileHeader`
    - `ProfileDetailsCard`
    - `PreferencesForm`
      - `ThemeToggle`
      - `AudioToggle`
    - `TutorialSection`
    - `LoadingState` / `ErrorState`

Pliki (proponowane):
- `src/pages/app/profile.astro`
- `src/components/profile/ProfileScreen.tsx`
- `src/components/profile/ProfileHeader.tsx`
- `src/components/profile/ProfileDetailsCard.tsx`
- `src/components/profile/PreferencesForm.tsx`
- `src/components/profile/TutorialSection.tsx`
- `src/components/common/LoadingState.tsx`
- `src/components/common/ErrorState.tsx`
- Reużycie `src/components/ui/button.tsx` oraz dodanie `Switch`, `Label` do `src/components/ui/` (jeśli brak)

## 4. Szczegóły komponentów
### ProfilePage (Astro)
- Opis: Strona Astro osadza `ProfileScreen` jako React island i zapewnia layout.
- Główne elementy: wrapper layoutu, kontener sekcji profilu.
- Zdarzenia: brak (statyczne osadzenie islanda).
- Walidacja: brak.
- Typy: brak.
- Propsy: przekazuje nic (logika w `ProfileScreen`).

### ProfileScreen (React)
- Opis: Główny kontener logiki i stanu. Pobiera profil, renderuje sekcje, obsługuje błędy/ładowanie.
- Główne elementy: `ProfileHeader`, `ProfileDetailsCard`, `PreferencesForm`, `TutorialSection`.
- Zdarzenia: inicjalizacja fetch profilu, retry na błąd, reakcja na zmiany preferencji (delegowane do formularza).
- Walidacja: sprawdzenie dostępności tokena; interpretacja błędów z API.
- Typy: `ProfileDTO`, `ApiErrorResponseDTO`, `ProfileViewModel`.
- Propsy: brak; komponent najwyższego poziomu.

### ProfileHeader
- Opis: Nagłówek widoku z tytułem i krótkim opisem.
- Główne elementy: tytuł, podtytuł.
- Zdarzenia: brak.
- Walidacja: brak.
- Typy: brak.
- Propsy: `{ userLogin?: string }` dla personalizacji (opcjonalne).

### ProfileDetailsCard
- Opis: Karta z danymi profilu: login, email, status tutoriala, data utworzenia.
- Główne elementy: lista pól/etykiet, badge statusu.
- Zdarzenia: brak interakcji modyfikujących.
- Walidacja: defensywne sprawdzenia pustych pól.
- Typy: `ProfileDTO` lub wyprowadzony `ProfileViewModel`.
- Propsy: `{ profile: ProfileViewModel }`.

### PreferencesForm
- Opis: Formularz preferencji UI z natychmiastowym podglądem. Zmiany zapisywane lokalnie.
- Główne elementy: selektor motywu (system/jasny/ciemny), przełącznik audio, przycisk reset.
- Zdarzenia: onChange (theme, audio), onClick (reset), emit aktualizacji do hooka.
- Walidacja: wartości dozwolone (enum motywu), typ boolean audio.
- Typy: `PreferencesViewModel`, `ThemeMode`.
- Propsy: `{ value: PreferencesViewModel; onChange: (next: PreferencesViewModel) => void; onReset?: () => void }`.

### ThemeToggle
- Opis: Sterowanie motywem (system/light/dark) z natychmiastową aplikacją Tailwind (`class` dark-mode).
- Główne elementy: `Select` lub `SegmentedControl` (można użyć `Select` z shadcn), ewentualnie trzy przyciski.
- Zdarzenia: onChange(mode).
- Walidacja: `mode ∈ {system, light, dark}`.
- Typy: `ThemeMode`.
- Propsy: `{ value: ThemeMode; onChange: (v: ThemeMode) => void }`.

### AudioToggle
- Opis: Włącza/wyłącza audio w aplikacji (flaga preferencji lokalnych).
- Główne elementy: `Switch` + `Label` (shadcn/ui).
- Zdarzenia: onChange(boolean).
- Walidacja: boolean.
- Typy: `boolean` w `PreferencesViewModel`.
- Propsy: `{ value: boolean; onChange: (v: boolean) => void }`.

### TutorialSection
- Opis: Sekcja z informacją o tutorialu i linkiem „Powtórz tutorial” do `/onboarding`.
- Główne elementy: opis, `Button` → link.
- Zdarzenia: kliknięcie w link.
- Walidacja: brak.
- Typy: brak.
- Propsy: `{ hasCompleted: boolean }`.

### LoadingState / ErrorState
- Opis: Komponenty wspólne do stanów ładowania i błędów.
- Główne elementy: spinner/szkielet, komunikaty błędów, `Retry`.
- Zdarzenia: `onRetry` wyzwala ponowne pobranie profilu.
- Walidacja: brak.
- Typy: opcjonalnie `ApiErrorUiModel`.
- Propsy: `LoadingState`: `{ label?: string }`; `ErrorState`: `{ message: string; onRetry?: () => void }`.

## 5. Typy
Wykorzystanie istniejących typów i dodanie lekkich modeli widoku dla preferencji/UI.

- Backend/DTO (istniejące):
  - `ProfileDTO` (z `src/types.ts`): `{ id, login, email, has_completed_tutorial, created_at }`
  - `ApiErrorResponseDTO` (z `src/types.ts`)

- Nowe typy ViewModel (frontend):

```ts
// View models - comments in English per code guidelines
export type ThemeMode = 'system' | 'light' | 'dark';

export interface PreferencesViewModel {
  theme: ThemeMode; // UI theme selection
  audioEnabled: boolean; // audio feature flag
}

export interface ProfileViewModel {
  id: string;
  login: string;
  email: string;
  hasCompletedTutorial: boolean;
  createdAtIso: string;
}

export interface ApiErrorUiModel {
  code: string;
  message: string;
}
```

Mapowanie DTO → ViewModel (w kodzie `ProfileScreen` lub helper):
- `has_completed_tutorial` → `hasCompletedTutorial`
- `created_at` → `createdAtIso`

Klucze storage (propozycja, bez wrażliwych danych):
- `aitutor:theme`
- `aitutor:audioEnabled`

## 6. Zarządzanie stanem
- `useProfile` (custom hook):
  - Cel: pobrać profil przez `/api/profile` z nagłówkiem `Authorization: Bearer <jwt>`;
  - Stan: `{ data?: ProfileViewModel, loading: boolean, error?: ApiErrorUiModel }`;
  - API: `refetch()`; automatyczny fetch na mount.

- `usePreferences` (custom hook):
  - Cel: zarządzać `PreferencesViewModel` (odczyt/zapis do `localStorage`, natychmiastowa aplikacja motywu);
  - Stan: `{ preferences, setPreferences, resetPreferences }`;
  - Efekt: przy zmianie `theme` dodaje/usuwa klasę `dark` na `document.documentElement` (Tailwind 4: `darkMode: 'class'`).

Uwagi wydajnościowe:
- Memoizacja selektorów i handlerów (React `useMemo`, `useCallback`).
- Minimalne renderowanie potomków poprzez podział komponentów.

## 7. Integracja API
Endpoint: `GET /api/profile`
- Autoryzacja: JWT Bearer w nagłówku `Authorization`.
- Sukces (200): `ProfileDTO`.
- Błędy: `401 UNAUTHORIZED`, `404 NOT_FOUND`, `500 INTERNAL_ERROR` (ciało `ApiErrorResponseDTO`).

Pobranie tokena (frontend):
- Wymagany klient Supabase w przeglądarce do uzyskania `access_token` z sesji.
- Zalecenie: dodać publiczne zmienne środowiskowe i klienta frontend lub wstrzyknąć token z istniejącej sesji, np.:

```ts
// Token retrieval example (browser) - comments in English
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
);

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
```

Wywołanie API (z użyciem tokena):

```ts
// API client example - comments in English
export async function fetchProfile(): Promise<ProfileViewModel> {
  const token = await getAccessToken();
  if (!token) throw { code: 'UNAUTHORIZED', message: 'Missing authentication token' };

  const res = await fetch('/api/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw err.error ?? { code: 'INTERNAL_ERROR', message: 'Unknown error' };
  }

  const dto = await res.json();
  const vm: ProfileViewModel = {
    id: dto.id,
    login: dto.login,
    email: dto.email,
    hasCompletedTutorial: dto.has_completed_tutorial,
    createdAtIso: dto.created_at,
  };
  return vm;
}
```

## 8. Interakcje użytkownika
- Zmiana motywu (ThemeToggle): natychmiastowa zmiana UI, zapis w `localStorage`.
- Przełącznik audio (AudioToggle): zapis w `localStorage`, wpływ na przyszłe funkcje audio.
- „Powtórz tutorial”: kliknięcie przenosi do `/onboarding`.
- `Retry` przy błędzie: ponowna próba pobrania profilu.

## 9. Warunki i walidacja
- Brak tokena (przed fetch): zablokuj call, pokaż błąd „Wymagane logowanie” i CTA do logowania.
- Token, ale `401` z API: potraktuj jako wygasłe logowanie → komunikat, opcjonalny redirect do `/login`.
- `404` z API: nietypowe dla zalogowanego (problem danych) → komunikat, przycisk `Zgłoś problem`/`Retry`.
- `500`: ogólny błąd serwera → komunikat, `Retry`.
- Formularz preferencji: ogranicz wartości do enumów/boolean (kontrolowane komponenty).

## 10. Obsługa błędów
- Standaryzacja: mapuj `ApiErrorResponseDTO.error` na `ApiErrorUiModel`.
- Komunikaty przyjazne użytkownikowi; logi w konsoli wyłącznie dla deweloperów.
- Mechanizm `retry` z prostym backoff (opcjonalnie `setTimeout` 500–1000 ms).
- Ochrona przed nieskończonym retry: maks. 3 próby.

## 11. Kroki implementacji
1. Routing i strona:
   - Utwórz `src/pages/app/profile.astro` z layoutem i osadzeniem `ProfileScreen` jako island.
2. Komponenty bazowe:
   - Dodaj `ProfileScreen`, `ProfileHeader`, `ProfileDetailsCard`, `TutorialSection`, `LoadingState`, `ErrorState`.
3. UI controls:
   - Reużyj `components/ui/button.tsx`; dodaj `Switch`, `Label` (jeśli brak) do `src/components/ui/`.
4. Hooki stanu:
   - Zaimplementuj `usePreferences` (storage, theme class) i `useProfile` (fetch + error/loading + retry).
5. Klient API (frontend):
   - Dodaj `getAccessToken()` (Supabase browser client) oraz `fetchProfile()` z bearer tokenem.
   - Skonfiguruj publiczne env: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (jeśli nie istnieją) lub alternatywny sposób pozyskania tokena.
6. Integracja w `ProfileScreen`:
   - Na mount: `useProfile` → renderuj `LoadingState`/`ErrorState`/`ProfileDetailsCard`.
   - Przekaż `PreferencesViewModel` do `PreferencesForm` i aktualizuj UI onChange.
7. UX i dostępność:
   - Etykiety, opisy, focus states, kontrast (Tailwind), przyjazne komunikaty błędów.
8. Testy ręczne:
   - Scenariusze: brak tokena, token wygasły, 200 OK, 404, 500; zmiany preferencji; link do `/onboarding`.
9. Dostosowanie stylów:
   - Responsywność, spacing, siatka `sm/md/lg`, motyw dark.
10. Hardening:
   - Ochrona przed błędami JSON, cleanup efektów, guards na `document` przy SSR.

---

Uwagi z PRD i planu UI:
- Widok ma być prosty, czytelny, bez przechowywania wrażliwych danych w `localStorage` (tylko preferencje UI).
- Sekcja „Powtórz tutorial” musi linkować do `/onboarding` (samouczek 3–4 kroki, wg PRD).
- Integracja z Supabase Auth: konieczny token JWT do wywołania `GET /api/profile`.



