# Plan implementacji widoku Onboarding (Samouczek wprowadzający)

## 1. Przegląd
Widok Onboarding to 4‑krokowy samouczek wprowadzający, którego celem jest:
- szybkie pokazanie kluczowych funkcji UI: demo rozmowy z AI, pole wzorów, mapa postępów;
- umożliwienie pominięcia po 2. kroku i powrotu później;
- ustawienie flagi profilu `has_completed_tutorial` po świadomym zakończeniu;
- zachowanie bieżącego kroku w `sessionStorage` i zapewnienie dostępności (np. `aria-live`).

Widok uruchamia się automatycznie po pierwszym logowaniu, gdy `has_completed_tutorial = false`. Po ukończeniu następuje przekierowanie do `/app`.

## 2. Routing widoku
- Ścieżka: `/onboarding`
- Wejście do widoku:
  - middleware/guard w aplikacji sprawdza profil (GET `/api/profile`) i gdy `has_completed_tutorial=false`, przekierowuje na `/onboarding`.
  - Po zakończeniu (lub świadomym pominięciu) następuje przekierowanie do `/app`.

## 3. Struktura komponentów
- `src/pages/onboarding.astro` (Astro page; SSR + hydratacja React)
  - `OnboardingApp` (React, client:load)
    - `OnboardingWizard`
      - `ProgressBar`
      - `StepContainer`
        - `StepIntro`
        - `StepConversationDemo`
        - `StepFormulaInput`
        - `StepProgressMap`
      - `StepControls` (Prev/Next/Skip/Finish)
      - (opcjonalnie) `ConsentConfirm` (dialog/checkbox potwierdzenia zakończenia)

## 4. Szczegóły komponentów
### OnboardingPage (`src/pages/onboarding.astro`)
- Opis: Strona Astro osadzająca aplikację React z shell’em layoutu (AppShell opcjonalnie ukryty).
- Główne elementy: `<main>`, kontener z maksymalną szerokością, mountpoint dla React.
- Zdarzenia: brak (przekazane do komponentu React).
- Walidacja: dostępność landmarków, fokus na nagłówku kroku po zmianie.
- Typy: brak bezpośrednich; hydratacja React.
- Propsy: brak.

### OnboardingApp
- Opis: Inicjalizacja stanu z `sessionStorage`, pobranie profilu (opcjonalnie, jeśli nie dostarczone wyżej), render `OnboardingWizard`.
- Główne elementy: kontener, globalny `aria-live="polite"` do anonsowania zmiany kroku.
- Zdarzenia: none (delegacja do `OnboardingWizard`).
- Walidacja: zabezpieczenie przed SSR/hydration mismatch (render po `useEffect` kiedy trzeba).
- Typy: `ProfileDTO` (opcjonalnie), `OnboardingStateVM`.
- Propsy: brak (możliwy prop `initialProfile?: ProfileDTO`).

### OnboardingWizard
- Opis: Rdzeń logiki kroków: zarządzanie indeksem kroku, regułami „Skip po 2. kroku”, zapis w `sessionStorage`, zakończenie flow.
- Główne elementy: `ProgressBar`, `StepContainer`, `StepControls`.
- Zdarzenia: `onNext`, `onPrev`, `onSkip`, `onFinish` (wywołuje PUT `/api/profile`).
- Walidacja:
  - indeks kroku w zakresie [0..3];
  - `canSkip = currentStep >= 2`;
  - blokada przycisków podczas zapisu profilu; focus management po zmianie kroku.
- Typy: `OnboardingStep`, `OnboardingStateVM`, `UpdateProfileCommand`, `ApiStateVM`.
- Propsy:
  - `initialStep?: number`
  - `onCompleted?: () => void` (callback po sukcesie)

### ProgressBar
- Opis: Pasek postępu kroków (4 segmenty) zgodny z shadcn/ui.
- Elementy: `Progress` lub własny grid z aktywnym indeksem.
- Zdarzenia: brak.
- Walidacja: kontrast/rozmiary, etykieta ARIA (np. `aria-label="Postęp samouczka"`).
- Typy: `OnboardingStep`.
- Propsy: `currentStep: number`, `totalSteps: number`.

### StepContainer
- Opis: Wrapper renderujący konkretny krok (switch po `currentStep`).
- Elementy: nagłówek kroku (focusable), treść kroku, opis.
- Zdarzenia: brak.
- Walidacja: ogłaszanie zmiany kroku przez `aria-live`.
- Typy: `OnboardingStep`.
- Propsy: `currentStep: number`.

### StepIntro
- Opis: Wprowadzenie do aplikacji, cele samouczka, nawigacja.
- Elementy: `Card`, tekst, ikony.
- Zdarzenia: brak (tylko Next).
- Walidacja: brak specjalnych.
- Typy: brak.
- Propsy: brak.

### StepConversationDemo
- Opis: Demo konwersacji (statyczne lub lekkie symulowane wiadomości).
- Elementy: mini `MessageList` (mock), przycisk mikrofonu (nieaktywny, informacyjny).
- Zdarzenia: lekkie mikro-interakcje (np. animacja dymków).
- Walidacja: brak danych; focus kolejności.
- Typy: opcjonalnie prosty `MessageItemVM`.
- Propsy: brak.

### StepFormulaInput
- Opis: Pokaz pola do wprowadzania wzorów (np. prosty LaTeX lub `^` potęgi), podgląd renderowania.
- Elementy: `Input`, `Button` „Wyślij”, lekkie sprawdzenie składni (lokalne).
- Zdarzenia: `onChange`, `onSubmit` (symulowane potwierdzenie).
- Walidacja: minimalna (niepusty input dla interakcji demo).
- Typy: `FormulaPreviewVM` (opcjonalnie).
- Propsy: brak.

### StepProgressMap
- Opis: Prezentacja skrótu do „Moje postępy” i wyjaśnienie wskaźników (makieta mapy/legendy).
- Elementy: `ProgressSummary` (mock), legenda statusów.
- Zdarzenia: brak.
- Walidacja: opisy ARIA dla kolorów/symboli.
- Typy: `ProgressLegendItemVM` (opcjonalnie).
- Propsy: brak.

### StepControls
- Opis: Nawigacja między krokami + logika „Skip” i „Zakończ”.
- Elementy: `Button` (Prev/Next/Skip/Finish), tekst pomocniczy, opcjonalna zgoda.
- Zdarzenia: `onNext`, `onPrev`, `onSkip`, `onFinish`.
- Walidacja: `Skip` tylko jeśli `canSkip` (krok ≥ 2); `Finish` wymaga aktywnej zgody użytkownika (kliknięcia).
- Typy: brak.
- Propsy: `{ canPrev: boolean; canNext: boolean; canSkip: boolean; isSaving: boolean; onPrev(): void; onNext(): void; onSkip(): void; onFinish(): void }`.

### ConsentConfirm (opcjonalnie)
- Opis: Checkbox lub modal potwierdzenia zakończenia tutoriala.
- Elementy: `Checkbox` + tekst „Zrozumiałem i chcę zakończyć”.
- Zdarzenia: `onChange` / `onConfirm`.
- Walidacja: `Finish` aktywny dopiero po zaznaczeniu.
- Typy: brak.
- Propsy: `{ checked: boolean; onChange(v: boolean): void }`.

## 5. Typy
- Reużywalne DTO (z `src/types.ts`):
  - `ProfileDTO` — `id`, `login`, `email`, `has_completed_tutorial`, `created_at`.
  - `UpdateProfileCommand` — `{ has_completed_tutorial: boolean }`.
  - `ApiErrorResponseDTO` — ujednolicony format błędu.

- Nowe ViewModel/typy dla widoku:
```ts
// Indeks kroków (0..3)
export type OnboardingStep = 0 | 1 | 2 | 3;

export interface OnboardingStateVM {
  currentStep: OnboardingStep;
  totalSteps: 4;
  canSkip: boolean; // currentStep >= 2
  isSavingProfile: boolean;
  hasConsentToFinish: boolean; // checkbox/dialog
}

export interface StepDescriptorVM {
  id: OnboardingStep;
  title: string;
  description?: string;
  ariaLabel?: string;
}

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';
export interface ApiStateVM<T = unknown> {
  status: ApiStatus;
  data?: T;
  error?: { code?: string; message: string };
}

export interface MessageItemVM {
  sender: 'user' | 'ai';
  text: string;
}

export interface FormulaPreviewVM {
  raw: string;
  rendered?: string; // np. KaTeX/MathJax w przyszłości
}

export interface ProgressLegendItemVM {
  label: string; // np. "Ukończone"
  colorClass: string; // Tailwind token
  ariaLabel: string;
}
```

- Stałe:
```ts
export const ONBOARDING_STORAGE_KEY = 'onboarding.step';
```

## 6. Zarządzanie stanem
- Lokalny stan w `OnboardingWizard` + dedykowany hook `useOnboardingProgress`:
  - odpowiedzialności: inicjalizacja kroku z `sessionStorage`, utrzymanie `currentStep`, zapis przy zmianie kroku, obliczanie `canSkip`, zarządzanie `hasConsentToFinish`, `isSavingProfile`.
  - API hooka:
```ts
interface UseOnboardingProgressResult {
  state: OnboardingStateVM;
  goNext(): void;
  goPrev(): void;
  skip(): void; // no-op jeśli !canSkip
  setConsent(v: boolean): void;
  finish(): Promise<void>; // PUT /api/profile
}
```
- A11y: po zmianie kroku przenosimy fokus na nagłówek kroku i anonsujemy zmianę przez `aria-live`.
- Odporność na odświeżenie: `sessionStorage` pod kluczem `ONBOARDING_STORAGE_KEY`.

## 7. Integracja API
- GET `/api/profile` (istniejący):
  - Auth: Supabase JWT (automatycznie przez middleware).
  - Response: `ProfileDTO`.
- PUT `/api/profile` (wg planu API – upewnić się, że endpoint jest wdrożony):
  - Body: `UpdateProfileCommand` `{ has_completed_tutorial: true }`.
  - Response: `ProfileDTO` (zaktualizowany).
  - Frontend: wywoływany tylko po świadomym kliknięciu „Zakończ”.

- Stany żądania i akcje UI:
  - `finish()` ustawia `isSavingProfile=true`, wysyła PUT, po sukcesie czyści `sessionStorage` klucz i przekierowuje do `/app`.
  - Błędy mapowane do toastów i stanu `ApiStateVM`.

## 8. Interakcje użytkownika
- Next/Prev: zmienia `currentStep` o ±1; zapis do `sessionStorage`.
- Skip: dostępny od kroku 2 (index ≥ 2); zakończenie tutoriala bez ustawiania flagi? (Decyzja: klik „Pomiń” powoduje przekierowanie do `/app` bez PUT; profil pozostaje `has_completed_tutorial=false` — umożliwia powrót z Profilu).
- Finish: aktywny dopiero po zaznaczeniu zgody (checkbox/modal); wykonuje PUT `/api/profile` → `has_completed_tutorial=true` → redirect `/app`.
- A11y: zmiana kroku anonsowana (`aria-live="polite"`), fokus na nagłówku kroku.

## 9. Warunki i walidacja
- Walidacje UI:
  - `currentStep` w [0..3].
  - `canSkip = currentStep >= 2`.
  - `Finish` wymaga `hasConsentToFinish===true`.
  - Podczas `isSavingProfile` przyciski nieaktywne, zapobiegamy wielokrotnemu wysłaniu.
- Warunki API:
  - PUT `/api/profile`: `has_completed_tutorial` typu boolean.
  - Obsługa 401/404/400 zgodnie ze standardem błędów (`ApiErrorResponseDTO`).

## 10. Obsługa błędów
- 401 (brak sesji): redirect do `/auth/login` + zachowanie intencji powrotu.
- 404 (profil nie znaleziony): wyświetlenie stanu błędu i CTA „Przejdź do /app” (degradacja łagodna).
- Sieć/offline: toasty + możliwość ponowienia PUT; przycisk „Spróbuj ponownie”.
- Timeout/500: komunikat przyjazny, retry z prostym backoff.
- `sessionStorage` niedostępne (tryb prywatny): fallback na stan w pamięci; ostrzeżenie dyskretne.

## 11. Kroki implementacji
1. Routing: dodaj `src/pages/onboarding.astro` i zabezpieczenie redirectów w middleware/guard (gdy `has_completed_tutorial=false` → `/onboarding`).
2. Utwórz `OnboardingApp` i `OnboardingWizard` (React 19), hydratacja `client:load`.
3. Zaimplementuj `useOnboardingProgress` (inicjalizacja z `sessionStorage`, obsługa nawigacji, `canSkip`, `finish`).
4. Zbuduj komponenty kroków: `StepIntro`, `StepConversationDemo`, `StepFormulaInput`, `StepProgressMap` (proste mikro‑interakcje, mockowane treści).
5. Dodaj `ProgressBar`, `StepControls` (blokady stanu, `aria-label`, focus management, `aria-live`).
6. Integracja API: GET `/api/profile` (prefetch na mount — opcjonalnie), PUT `/api/profile` w `finish()`; mapowanie stanów do toastów.
7. UX: zapisywanie kroku w `sessionStorage`, focus po zmianie kroku, odpowiednie role/ARIA.
8. Testy ręczne: scenariusze Next/Prev/Skip/Finish; odświeżenie w każdym kroku; błąd PUT; offline.
9. Finalizacja: redirect do `/app` po sukcesie, link „Powtórz tutorial” w `/app/profile` (już przewidziany w UI planie).

---

Notatki wdrożeniowe (stack):
- Astro 5 + React 19: hydratacja tylko komponentu Wizard.
- Tailwind 4: layout, spacing, responsywność.
- shadcn/ui: `Button`, `Checkbox`, `Card`, `Progress`, `Toast`.
- Zgodność z PRD US‑003 i planem API (Onboarding Flow). Jeśli PUT `/api/profile` nie jest jeszcze wdrożony, tymczasowo wyłącz przycisk „Zakończ” lub obsłuż komunikatem o niedostępności i nie ustawiaj flagi.
