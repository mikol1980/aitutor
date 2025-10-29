# Architektura UI dla AI Tutor Matematyki

## 1. Przegląd struktury UI

AI Tutor Matematyki to aplikacja webowa zaprojektowana jako full-stack SSR (Server-Side Rendering) z wykorzystaniem Astro i React. Architektura interfejsu użytkownika opiera się na trzech głównych filarach:

1. **Adaptacyjność** - interfejs dostosowuje się do poziomu wiedzy ucznia przez testy diagnostyczne i dynamiczne rekomendacje
2. **Konwersacyjność** - centralna rola sesji nauki z AI, która łączy interakcję głosową, tekstową i wizualizacje
3. **Transparentność postępów** - jasna wizualizacja mapy umiejętności i postępów w nauce

### Główne założenia projektowe:

- **Mobile-first responsive design** - aplikacja musi działać płynnie na urządzeniach mobilnych
- **Dostępność (WCAG 2.1 AA)** - semantyczny HTML, ARIA landmarks, keyboard navigation
- **Bezpieczeństwo** - wszystkie widoki chronione RLS policies, httpOnly cookies dla tokenów
- **Język polski** - wszystkie komunikaty i interface w języku polskim
- **Minimalistyczny design** - skupienie na treści edukacyjnej, Tailwind CSS + shadcn/ui

### Architektura techniczna UI:

- **Strony Astro** (.astro) - layout, SSR, routing
- **Komponenty React** (client:load) - interaktywne "wyspy" (sesja nauki, formularze, mapy postępów)
- **Zarządzanie stanem** - React hooks (useState, useEffect), custom hooks dla API calls
- **Autentykacja** - middleware z cookie-based session restoration
- **Stylowanie** - Tailwind CSS 4, shadcn/ui components, dark mode support

## 2. Lista widoków

### 2.1 Landing Page

**Ścieżka:** `/`

**Główny cel:** Prezentacja value proposition i zachęcenie do rejestracji/logowania użytkowników zaproszonych do bety.

**Kluczowe informacje:**
- Headline: "Twój osobisty tutor matematyki dostępny 24/7"
- Value propositions: Adaptacyjna nauka, AI tutor, wizualizacje matematyczne
- Przystępna cena (79-99 PLN/miesiąc, 2-3x taniej niż tradycyjne korepetycje)
- CTA: "Dołącz do bety" / "Zaloguj się"

**Kluczowe komponenty:**
- `LandingHero` - sekcja hero z głównym CTA
- `FeatureCard` (3-4 karty) - przedstawienie kluczowych funkcji:
  - Rozmowa głosowa z AI
  - Automatyczna identyfikacja braków
  - Interaktywne wizualizacje
  - Personalizowana ścieżka nauki
- `CTASection` - secondary CTA przed footer
- `Footer` - linki (polityka prywatności, kontakt)

**UX, dostępność, bezpieczeństwo:**
- **UX:** Jasny, minimalistyczny design; focus na benefitach dla ucznia; autentyczne testimoniale (gdy dostępne)
- **Dostępność:** Alt text dla wszystkich obrazów, kontrastowe przyciski CTA, semantic HTML (header, main, section, footer)
- **Bezpieczeństwo:** Brak wrażliwych danych na stronie publicznej

---

### 2.2 Login

**Ścieżka:** `/auth/login`

**Główny cel:** Autentykacja powracających użytkowników.

**Kluczowe informacje:**
- Formularz logowania (email, hasło)
- Link do rejestracji
- Link do odzyskiwania hasła (placeholder w MVP)
- Komunikaty błędów (nieprawidłowe dane, email niezweryfikowany)

**Kluczowe komponenty:**
- `LoginForm` (React) - formularz z walidacją
  - `Input` (email type) z labelem
  - `Input` (password type) z labelem i toggle visibility
  - `Button` (Submit) - "Zaloguj się"
  - `ErrorState` - inline errors przy polach
- `Card` - wrapper dla formularza
- Linki nawigacyjne: "Nie masz konta? Zarejestruj się" + "Zapomniałeś hasła?"

**UX, dostępność, bezpieczeństwo:**
- **UX:** Auto-focus na polu email, Enter submits form, loading state na przycisku podczas API call
- **Dostępność:** Labels powiązane z inputs (htmlFor), error messages w ARIA live regions, keyboard navigation
- **Bezpieczeństwo:** Password input type="password", validacja client-side + server-side, httpOnly cookies dla tokenów, redirect do dashboard po sukcesie

---

### 2.3 Register

**Ścieżka:** `/auth/register`

**Główny cel:** Utworzenie konta dla nowych użytkowników posiadających kod dostępu do zamkniętej bety.

**Kluczowe informacje:**
- Pole na kod dostępu (wymagane, unikalny kod beta)
- Login (min 3 znaki, unikalny)
- Email (format email, unikalny)
- Hasło (min 6 znaków)
- Powtórz hasło (musi być identyczne)
- Checkbox akceptacji polityki prywatności
- Link do logowania

**Kluczowe komponenty:**
- `RegisterForm` (React) - formularz z walidacją
  - `Input` dla każdego pola z inline validation
  - `Checkbox` dla polityki prywatności
  - `Button` (Submit) - "Zarejestruj się"
  - `ErrorState` - komunikaty błędów (kod nieprawidłowy, email zajęty, hasła różne)
- `Card` - wrapper
- Link nawigacyjny: "Masz już konto? Zaloguj się"

**UX, dostępność, bezpieczeństwo:**
- **UX:** Walidacja inline (onChange), komunikaty w języku polskim, disabled submit do momentu wypełnienia wszystkich pól, auto-login po rejestracji + redirect do tutorial
- **Dostępność:** Labels, ARIA error announcements, focus management, semantic HTML
- **Bezpieczeństwo:** Validacja kodu beta server-side, hasło min 6 znaków (Supabase default), sanityzacja inputów, trigger w bazie tworzy profil automatycznie

---

### 2.4 Onboarding Tutorial

**Ścieżka:** `/app/onboarding` (automatyczny redirect po pierwszym logowaniu jeśli `has_completed_tutorial = false`)

**Główny cel:** Wprowadzenie nowych użytkowników do kluczowych funkcji aplikacji (US-003).

**Kluczowe informacje:**
- Krok 1/4: "Witaj! Pokażemy Ci, jak korzystać z AI Tutor"
- Krok 2/4: Demonstracja aktywacji mikrofonu (symulacja przycisk mic)
- Krok 3/4: Pole tekstowe i jak wpisywać wzory (np. "x^2 + 3x - 5")
- Krok 4/4: Przykładowa wizualizacja (wykres funkcji)
- Możliwość pominięcia tutorialu

**Kluczowe komponenty:**
- `OnboardingModal` (React) - overlay modal z krokami
  - `ProgressIndicator` - "Krok 2/4"
  - `OnboardingStep` - każdy krok z ilustracją + krótkim tekstem
  - `ButtonGroup` - "Pomiń", "Dalej", "Zakończ"
- Animacje przejść między krokami (opcjonalne)

**UX, dostępność, bezpieczeństwo:**
- **UX:** Max 3-4 kroki (PRD wymaga), możliwość pominięcia i powrotu z profilu ("Pokaż ponownie samouczek"), jasne ilustracje
- **Dostępność:** Keyboard navigation (Tab, Enter, Esc closes modal), focus trap w modalu, ARIA role="dialog"
- **Bezpieczeństwo:** Po zakończeniu PUT /api/profile z `has_completed_tutorial: true`, brak wrażliwych danych

---

### 2.5 Dashboard (Sections List)

**Ścieżka:** `/app/dashboard`

**Główny cel:** Główny punkt startowy po zalogowaniu; prezentacja wszystkich działów matematyki i punktu wejścia do nauki.

**Kluczowe informacje:**
- Powitanie: "Witaj, [Login]!"
- Lista działów (GET /api/sections):
  - Tytuł działu (np. "Funkcje")
  - Krótki opis
  - Progress bar - procent ukończonych tematów w dziale
  - Badge ze statusem (np. "3/8 ukończone")
  - CTA: "Kontynuuj" (jeśli in_progress) lub "Rozpocznij" (jeśli not_started)
- Quick stats card:
  - Ogólny postęp: "Ukończono X z Y tematów"
  - Ostatnia sesja: data i temat
  - (Post-MVP: Streak - dni z rzędu nauki)

**Kluczowe komponenty:**
- `DashboardHeader` - nagłówek z nawigacją (Dashboard, Progress Map, Profile icons)
- `WelcomeCard` - powitanie + quick stats
- `SectionGrid` - grid/flex layout z `SectionCard`:
  - Każda karta = link do `/app/sections/{sectionId}`
  - `Card` z hover state
  - `ProgressBar` komponent
  - `Badge` dla statusu
  - `Button` CTA
- `LoadingState` / `ErrorState` - podczas ładowania lub błędów API

**UX, dostępność, bezpieczeństwo:**
- **UX:** Cała karta klikalna (not just button), hover states, responsive grid (mobile: 1 col, tablet: 2 cols, desktop: 3 cols)
- **Dostępność:** Semantic HTML (main, section, article), headings hierarchy (h1, h2), keyboard focus indicators, ARIA labels dla progress bars
- **Bezpieczeństwo:** RLS policies zapewniają, że GET /api/user-progress zwraca tylko dane zalogowanego użytkownika; autoryzacja w middleware

---

### 2.6 Section Detail

**Ścieżka:** `/app/sections/{sectionId}`

**Główny cel:** Prezentacja tematów w wybranym dziale, opcjonalnie test diagnostyczny, rozpoczęcie nauki konkretnego tematu.

**Kluczowe informacje:**
- Breadcrumb: Dashboard > [Nazwa działu]
- Tytuł działu + pełny opis
- Card "Test diagnostyczny" (jeśli nieukończony):
  - "Sprawdź swój poziom wiedzy"
  - Wyjaśnienie: "Krótki test 3-5 pytań pomoże dostosować materiał do Twojego poziomu"
  - CTA: "Rozpocznij test"
- Lista tematów w dziale (GET /api/sections/{id}/topics + progress):
  - Topic cards:
    - Tytuł tematu
    - Status badge: "Nierozpoczęty", "W trakcie", "Ukończone"
    - Score (jeśli completed): np. "Wynik: 85%"
    - Lock icon (jeśli są niezakończone dependencies - soft lock w MVP, można wejść ale AI sugeruje wcześniejsze tematy)
    - CTA: "Rozpocznij" / "Kontynuuj" / "Powtórz"
- Progress summary: "Ukończono X z Y tematów"

**Kluczowe komponenty:**
- `Breadcrumb` - nawigacja wstecz
- `SectionHeader` - tytuł + opis
- `DiagnosticTestCard` - jeśli test nie ukończony (warunkowe renderowanie)
- `TopicsList` - lista `TopicCard`:
  - `Badge` dla statusu
  - `ProgressIndicator` (circular lub bar)
  - `LockIcon` (conditional, z tooltip wyjaśniającym dependencies)
  - `Button` CTA
- `ProgressSummary` - podsumowanie działu

**UX, dostępność, bezpieczeństwo:**
- **UX:** Jasna hierarchia wizualna (test diagnostyczny na górze jeśli nieukończony), dependencies pokazane jako sugestie (nie hard block w MVP), tooltips dla locked topics
- **Dostępność:** Breadcrumb navigation, headings structure, ARIA labels dla lock state ("Ten temat wymaga ukończenia: Ułamki")
- **Bezpieczeństwo:** RLS dla user_progress, validacja sectionId server-side (404 jeśli nie istnieje)

---

### 2.7 Diagnostic Test

**Ścieżka:** `/app/sections/{sectionId}/diagnostic-test`

**Główny cel:** Przeprowadzenie testu diagnostycznego (3-5 pytań) w celu oceny poziomu wiedzy ucznia i dostosowania materiału (US-004).

**Kluczowe informacje:**
- Header: "Test diagnostyczny - [Nazwa działu]"
- Progress bar: "Pytanie 2 z 5"
- Treść pytania (z learning_content, usage_type='diagnostic_question')
- Opcje odpowiedzi:
  - Multiple choice: radio buttons
  - Short answer: text input
- Opcjonalnie: Obrazek/wizualizacja do pytania (jeśli w content.images)
- Navigation buttons: "Następne" (disabled do momentu wyboru odpowiedzi)
- Opcjonalnie: "Poprzednie" (jeśli chcemy umożliwić zmianę odpowiedzi - nice to have)

**Kluczowe komponenty:**
- `DiagnosticTestHeader` - tytuł + progress bar
- `QuestionCard` (React) - główny komponent:
  - `QuestionText` - wyświetlenie treści
  - `AnswerOptions` - radio group lub input (zależnie od typu)
  - `NavigationButtons` - "Następne" + "Poprzednie"
- State management:
  - Aktywne pytanie (index)
  - Odpowiedzi użytkownika (array)
  - Loading states dla POST /api/user-answers
- Po ostatnim pytaniu: auto-submit PUT /api/diagnostic-test-attempts/{id}/complete

**UX, dostępność, bezpieczeństwo:**
- **UX:** Autosave odpowiedzi (POST per question), disable "Następne" bez odpowiedzi, loading indicator podczas API calls, możliwość cofnięcia (nice to have)
- **Dostępność:** Radio groups z proper labels, keyboard navigation (Arrow keys w radio group, Tab between elements), ARIA live region dla progress updates
- **Bezpieczeństwo:** Server-side validation odpowiedzi, RLS dla diagnostic_test_attempts (tylko własne), prevent multiple simultaneous attempts (business logic)

---

### 2.8 Diagnostic Test Results

**Ścieżka:** `/app/sections/{sectionId}/diagnostic-test/results?attemptId={attemptId}`

**Główny cel:** Prezentacja wyników testu diagnostycznego z analizą i rekomendacją pierwszego tematu do nauki.

**Kluczowe informacje:**
- Header: "Wyniki testu - [Nazwa działu]"
- Score display: Duży, wizualny (np. "4 z 5 poprawnych" = 80%, circular progress lub podobny)
- Breakdown:
  - Lista pytań z ikonami ✓ (poprawne) / ✗ (niepoprawne)
  - Opcjonalnie: kliknięcie pokazuje wyjaśnienie (expand/collapse)
- Analiza:
  - "Mocne strony: Funkcje liniowe, równania"
  - "Obszary do poprawy: Ułamki, potęgi"
- Recommendation card:
  - "Polecamy rozpoczęcie od tematu: **Funkcje liniowe**"
  - Krótkie uzasadnienie (np. "Ten temat najlepiej pasuje do Twojego obecnego poziomu")
  - CTA: "Rozpocznij naukę" → redirect do `/app/sessions/new?topicId={recommendedTopicId}`
- Alternative CTA: "Zobacz wszystkie tematy w dziale"

**Kluczowe komponenty:**
- `TestResultsHeader` - tytuł
- `ScoreDisplay` - duży, wizualny wynik (CircularProgress + procent)
- `QuestionBreakdown` - lista z ikonami + opcjonalne expandable wyjaśnienia
- `AnalysisCard` - mocne strony + obszary do poprawy
- `RecommendationCard` - rekomendacja + CTA
- `Button` - alternative action (wszystkie tematy)

**UX, dostępność, bezpieczeństwo:**
- **UX:** Pozytywny, zachęcający ton ("Świetnie! 80% to bardzo dobry wynik"), focus na następnym kroku (rekomendacja), opcja przeglądu wszystkich tematów
- **Dostępność:** Clear headings, semantic structure (section dla każdego bloku), ARIA labels dla score (np. aria-label="Wynik 80 procent")
- **Bezpieczeństwo:** RLS dla diagnostic_test_attempts (tylko własne wyniki), validacja attemptId

---

### 2.9 Learning Session

**Ścieżka:** `/app/sessions/{sessionId}`

**Główny cel:** Prowadzenie konwersacji z AI tutorem w kontekście wybranego tematu; nauka, zadawanie pytań, wizualizacje, identyfikacja braków (US-005 do US-010).

**Kluczowe informacje:**
- Tytuł aktualnego tematu
- Status sesji (aktywna / zakończona)
- Historia konwersacji (user messages + AI responses)
- Panel wizualizacji (wykresy, wzory)
- Pole wprowadzania tekstu/wzorów
- Przycisk głosowy (placeholder w MVP)
- Opcjonalnie: pasek trybu powtórkowego (ReviewModeBar) gdy AI proponuje cofnięcie do wcześniejszego tematu

**Kluczowe komponenty:**

#### Layout główny:
```
┌─────────────────────────────────────────────┐
│ SessionHeader                               │
├─────────────────────────────────────────────┤
│ ReviewModeBar (conditional)                 │
├─────────────────────────────────────────────┤
│ Main Area (2-column lub responsive stack)  │
│ ┌────────────────┬────────────────────────┐│
│ │ MessageList    │ VisualizationPanel     ││
│ │ (scrollable)   │ (collapsible)          ││
│ │                │                        ││
│ │ - MessageItem  │ - Canvas/Image         ││
│ │   (user/ai)    │ - Formula render       ││
│ │ - MessageItem  │ - Chart                ││
│ │ ...            │                        ││
│ └────────────────┴────────────────────────┘│
├─────────────────────────────────────────────┤
│ InputArea (sticky bottom)                   │
│ - Textarea + Send button + Voice button     │
└─────────────────────────────────────────────┘
```

#### Szczegółowe komponenty (z session-view-ui-implementation-plan.md):

1. **SessionHeader**
   - Tytuł tematu (np. "Funkcje liniowe")
   - Badge statusu (aktywna/zakończona)
   - Czas trwania lub timestamp started_at
   - Button "Zakończ sesję" (disabled jeśli już zakończona)

2. **ReviewModeBar** (conditional)
   - Alert/Banner w kolorze ostrzegawczym
   - Komunikat: "Tryb powtórki: Ułamki - Po zakończeniu wrócimy do tematu głównego"
   - Przycisk "Wyjdź z powtórki" (opcjonalny)

3. **MessageList**
   - Scrollable container (auto-scroll do dołu przy nowych wiadomościach)
   - `MessageItem` (user):
     - Awatar użytkownika (inicjały z loginu)
     - Bubble z tekstem (right-aligned)
     - Timestamp
   - `MessageItem` (ai):
     - Awatar AI (ikona lub logo)
     - Bubble z tekstem (left-aligned)
     - Opcjonalnie: Audio player (jeśli `audio_url` w content)
     - Timestamp
   - Loading indicator dla wiadomości w trakcie wysyłania (optymistyczne dodanie)
   - Placeholder: "Rozpocznij rozmowę z AI..." (jeśli brak wiadomości)

4. **VisualizationPanel**
   - Collapsible panel (przycisk zwijania/rozwijania)
   - Canvas lub Image container dla:
     - Wykresów funkcji (np. Manim/p5.js/D3.js - decyzja TBD)
     - Wzorów (LaTeX render, np. KaTeX lub MathJax)
     - Diagramów geometrycznych
   - Placeholder w MVP: "Panel wizualizacji - wkrótce"
   - Opcjonalnie: Fullscreen mode (via portal - post-MVP)

5. **InputArea**
   - `Textarea` (autosize, max height z scrollem)
   - Placeholder: "Wpisz pytanie lub wzór matematyczny (np. x^2 + 3x - 5)..."
   - Character counter (soft limit: 4000 znaków)
   - `Button` "Wyślij" (Enter lub Ctrl+Enter)
   - `Button` "Głos" z ikoną mikrofonu (disabled w MVP, placeholder)
   - Disabled state gdy:
     - Sesja zakończona (endedAt !== null)
     - Trwa wysyłanie wiadomości (isSending: true)
     - Pole puste (text.trim().length === 0)

**Data flow:**
- Initial load: GET /api/sessions/{id} + GET /api/sessions/{id}/messages
- User sends message:
  1. Optymistyczne dodanie do MessageList (clientId, isOptimistic: true)
  2. POST /api/sessions/{id}/messages
  3. Na sukces: podmiana na wiadomość z serwera
  4. Na błąd: rollback + toast z retry option
- AI response: WebSocket lub polling (decyzja TBD; MVP: manual refresh lub long polling)
- End session:
  1. Confirmation modal
  2. PUT /api/sessions/{id}/end (z ai_summary jeśli generowane)
  3. Update session state (endedAt, aiSummary)
  4. Disabled InputArea, pokazanie podsumowania

**UX, dostępność, bezpieczeństwo:**
- **UX:**
  - Auto-focus na textarea po załadowaniu
  - Auto-scroll do dołu przy nowych wiadomościach
  - Optymistyczne dodawanie wiadomości (instant feedback)
  - Loading states dla AI response
  - Potwierdzenie przed zakończeniem sesji (prevent accidental loss)
  - Keyboard shortcuts (Esc = zakończ z potwierdzeniem)
- **Dostępność:**
  - ARIA live region dla nowych wiadomości AI (screen reader announcements)
  - Semantic HTML (main, aside dla VisualizationPanel, form dla InputArea)
  - Keyboard navigation (Tab, Enter, Esc)
  - Alt text dla wizualizacji
  - Focus management (focus na textarea po wysłaniu wiadomości)
- **Bezpieczeństwo:**
  - RLS policies (tylko własne sesje)
  - Validacja długości wiadomości client-side + server-side (max 4000 znaków)
  - Sanityzacja treści przed renderowaniem (XSS protection)
  - httpOnly cookies dla auth

---

### 2.10 Progress Map

**Ścieżka:** `/app/progress`

**Główny cel:** Wizualizacja postępów użytkownika w nauce; przegląd wszystkich działów, tematów, statusów i wyników (US-011).

**Kluczowe informacje:**
- Header: "Moja Mapa Postępów"
- Overall stats:
  - Ukończone tematy: X z Y
  - Średni wynik: Z%
  - (Post-MVP: Streak - dni z rzędu nauki)
- Filtrowanie:
  - Wszystkie / W trakcie / Ukończone
  - Sortowanie: domyślnie według display_order
- Lista działów (accordion lub tabs):
  - Każdy dział expandable
  - W środku: lista tematów w dziale
    - Topic card:
      - Tytuł tematu
      - Status badge + icon (🔒 not_started, 🔄 in_progress, ✓ completed)
      - Progress bar lub circular indicator z score
      - Last activity date (jeśli available)
      - Quick action button: "Kontynuuj" / "Rozpocznij powtórkę" / "Rozpocznij"

**Kluczowe komponenty:**
- `ProgressMapHeader` - tytuł + overall stats card
- `FilterBar` - filter buttons (Wszystkie, W trakcie, Ukończone) + view toggle (grid/list)
- `SectionsAccordion` - accordion z działami:
  - `AccordionItem` per section
  - Inside: `TopicProgressList`
    - `TopicProgressCard`:
      - `Badge` dla statusu
      - `ProgressIndicator` (score)
      - Timestamp (last_updated)
      - `Button` CTA
- `LoadingState` / `ErrorState`

**UX, dostępność, bezpieczeństwo:**
- **UX:**
  - Filtrowanie instant (client-side jeśli wszystkie dane załadowane, lub API call z query params)
  - Wizualne wskazanie postępu (kolory: red/not_started, yellow/in_progress, green/completed)
  - Accordion domyślnie collapsed (user expand as needed)
  - Quick actions dla szybkiego rozpoczęcia/kontynuacji
- **Dostępność:**
  - Accordion z ARIA (aria-expanded, aria-controls)
  - Status indicators z text alternatives (nie tylko kolory)
  - Keyboard navigation (Arrow keys w accordion)
  - Headings hierarchy
- **Bezpieczeństwo:**
  - RLS dla user_progress
  - Query params validation (status filter w ['not_started', 'in_progress', 'completed'])

---

### 2.11 Profile Settings

**Ścieżka:** `/app/profile`

**Główny cel:** Zarządzanie danymi użytkownika i preferencjami aplikacji.

**Kluczowe informacje:**
- Dane osobowe:
  - Login (read-only w MVP)
  - Email (read-only w MVP)
  - Avatar (placeholder - post-MVP)
- Preferencje:
  - Theme toggle (light / dark / system)
  - Audio toggle (AI voice on/off)
  - Language (PL only w MVP, placeholder dla przyszłości)
- Tutorial:
  - Button "Pokaż ponownie samouczek"
- Account actions:
  - Button "Wyloguj się"

**Kluczowe komponenty:**
- `ProfileHeader` - tytuł + avatar placeholder
- `Tabs` lub `Accordion` z sekcjami:
  1. **Dane osobowe:**
     - `Input` (disabled) dla loginu
     - `Input` (disabled) dla emaila
     - Info: "Zmiana danych dostępna wkrótce" (post-MVP)
  2. **Preferencje:**
     - `ThemeToggle` - radio group lub switch (light/dark/system)
     - `AudioToggle` - switch (AI voice on/off)
     - Autosave on change (localStorage + PUT /api/profile jeśli backend wspiera)
  3. **Tutorial:**
     - `Button` "Pokaż ponownie samouczek" → redirect do /app/onboarding
  4. **Konto:**
     - `Button` "Wyloguj się" → confirmation → POST /auth/v1/logout + clear cookies + redirect do /auth/login

**UX, dostępność, bezpieczeństwo:**
- **UX:**
  - Autosave preferencji (instant feedback)
  - Potwierdzenie wylogowania (modal)
  - Toast notifications dla sukcesu/błędu
- **Dostępność:**
  - Labels dla wszystkich controls
  - Focus management w tabs
  - ARIA switches dla toggles
- **Bezpieczeństwo:**
  - Logout = clear httpOnly cookies server-side + client-side session clear
  - RLS dla profilu (tylko własny)

---

### 2.12 Error States

**Ścieżki:** Różne (zależnie od błędu)

**Główny cel:** Komunikacja błędów i wskazówki co dalej robić.

#### 401 Unauthorized

**Ścieżka:** Automatyczny redirect z middleware lub error boundary

**Komunikat:** "Sesja wygasła. Zaloguj się ponownie."

**Komponenty:**
- `ErrorState` component z kodem 401
- CTA: "Zaloguj się" → redirect do `/auth/login?redirect={currentPath}`

**Logika:** Middleware sprawdza session; jeśli brak lub wygasła, redirect do loginu z query param dla powrotu po zalogowaniu.

#### 403 Forbidden

**Komunikat:** "Brak dostępu do tego zasobu."

**Komponenty:**
- `ErrorState` z kodem 403
- CTA: "Powrót do Dashboard"

**Przypadki:** User próbuje dostać się do sesji/progress innego użytkownika (RLS blokuje).

#### 404 Not Found

**Komunikat:** "Nie znaleziono strony."

**Komponenty:**
- `ErrorState` z kodem 404
- CTA: "Powrót do Dashboard"
- Opcjonalnie: wyszukiwarka lub sugestie

#### 500 Internal Server Error

**Komunikat:** "Wystąpił błąd. Spróbuj ponownie za chwilę."

**Komponenty:**
- `ErrorState` z kodem 500
- CTA: "Spróbuj ponownie" (retry function)
- Opcjonalnie: "Zgłoś problem" (link do kontaktu/issue tracker - post-MVP)

**UX, dostępność, bezpieczeństwo:**
- **UX:** Przyjazne, niewinne komunikaty (brak technicznego żargonu), jasne akcje naprawcze
- **Dostępność:** Error messages w ARIA live regions (assertive), keyboard accessible buttons
- **Bezpieczeństwo:** Nie ujawniać szczegółów technicznych błędu (stack traces, database errors); logować server-side dla debugowania

---

## 3. Mapa podróży użytkownika

### Główny przepływ: Od rejestracji do ukończenia pierwszego tematu

```
┌──────────────────────────────────────────────────────────────────┐
│                    1. Wejście na Landing Page                    │
│  User: Zapoznanie z ofertą, klik "Dołącz do bety"              │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                       2. Register                                │
│  User: Wprowadza kod beta, login, email, hasło                  │
│  System: Walidacja → POST /auth/v1/signup → trigger tworzy      │
│          profil → auto-login → redirect                          │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                  3. Onboarding Tutorial                          │
│  User: Przechodzi 3-4 kroki wprowadzające                       │
│  System: Po zakończeniu PUT /api/profile                         │
│          (has_completed_tutorial: true)                          │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                      4. Dashboard                                │
│  User: Widzi listę działów, wybiera "Funkcje"                   │
│  System: GET /api/sections + GET /api/user-progress             │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                   5. Section Detail                              │
│  User: Widzi opis działu, klik "Rozpocznij test diagnostyczny"  │
│  System: GET /api/sections/{id}/topics                           │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                   6. Diagnostic Test                             │
│  User: Odpowiada na 3-5 pytań                                   │
│  System: POST /api/diagnostic-test-attempts                      │
│          → POST /api/user-answers (per question)                 │
│          → PUT /api/diagnostic-test-attempts/{id}/complete       │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│              7. Diagnostic Test Results                          │
│  User: Widzi wynik 80%, rekomendację "Funkcje liniowe"          │
│        Klik "Rozpocznij naukę"                                   │
│  System: Redirect do /app/sessions/new?topicId={id}             │
│          → POST /api/sessions                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                  8. Learning Session                             │
│  User:                                                           │
│  - Wpisuje pytanie: "Czym jest funkcja liniowa?"                │
│    → POST /api/sessions/{id}/messages (user)                    │
│  - AI odpowiada (głos + tekst)                                  │
│    → Backend: AI generates response                              │
│    → POST /api/sessions/{id}/messages (ai)                      │
│  - User: "Pokaż mi wykres funkcji y = 2x + 3"                   │
│  - AI generuje wykres w VisualizationPanel                       │
│  - User rozwiązuje zadanie, popełnia błąd w ułamkach            │
│  - AI: "Widzę problem z ułamkami. Zrobimy 5-minutową             │
│         powtórkę?" → User: "Tak"                                 │
│  - ReviewModeBar pojawia się                                     │
│  - Mini-sesja powtórkowa (ułamki):                               │
│    → Backend: Nowa sesja z topic_id = "Ułamki"                  │
│    → User: Przechodzi przez 2-3 zadania                         │
│  - AI: "Świetnie! Wróćmy do funkcji liniowych"                  │
│    → ReviewModeBar znika, powrót do głównej sesji               │
│  - User kończy temat, klik "Zakończ sesję"                      │
│    → Confirmation modal                                          │
│    → PUT /api/sessions/{id}/end (ai_summary generowane)         │
│    → PUT /api/user-progress/{topicId} (status: completed,       │
│       score: 0.85)                                               │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                    9. Progress Map                               │
│  User: Klik navigation "Progress Map"                           │
│  System: GET /api/user-progress                                  │
│  User: Widzi "Funkcje liniowe" - completed (85%)                │
│        Badge: ✓ Ukończone                                        │
└────────────────────────┬─────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                   10. Dashboard (Powrót)                         │
│  User: Wraca do Dashboard, widzi postęp w dziale "Funkcje":     │
│        "1/8 ukończone"                                           │
│        Wybiera kolejny temat: "Funkcje kwadratowe"              │
│  System: → POST /api/sessions → Learning Session...             │
└──────────────────────────────────────────────────────────────────┘
```

### Alternatywne przepływy:

#### Powracający użytkownik:
```
Landing Page → Login → Dashboard → Kontynuacja nauki
```

#### Przeglądanie postępów:
```
Dashboard → Progress Map → Analiza braków → Wybór tematu do powtórki → Learning Session
```

#### Zmiana preferencji:
```
Dashboard → Profile (navigation) → Zmiana theme/audio → Autosave → Powrót
```

#### Obsługa błędów:
```
Dowolny widok → 401 Unauthorized → Login → Redirect z powrotem
Dowolny widok → 404 Not Found → Error State → Dashboard
Dowolny widok → 500 Server Error → Error State → Retry lub Dashboard
```

---

## 4. Układ i struktura nawigacji

### Primary Navigation (Top Bar - zawsze widoczna po zalogowaniu)

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo] AI Tutor           Dashboard  Progress  Profile  [🔔] │
└────────────────────────────────────────────────────────────────┘
```

**Komponenty:**
- Logo (link do Dashboard)
- Navigation links:
  - **Dashboard** (icon: Home) → `/app/dashboard`
  - **Progress Map** (icon: Chart) → `/app/progress`
  - **Profile** (icon: User) → `/app/profile`
- Notifications bell (icon, placeholder w MVP - post-MVP feature)

**Desktop:** Horizontal top bar, zawsze widoczna
**Mobile:** Bottom tab bar z ikonami (bez tekstu, tylko ikony + labels dla accessibility)

### Secondary Navigation (Kontekstowa)

#### Breadcrumbs (w widokach zagnieżdżonych):
- Section Detail: `Dashboard > Funkcje`
- Diagnostic Test: `Dashboard > Funkcje > Test diagnostyczny`
- Learning Session: `Dashboard > Funkcje > Funkcje liniowe`

**Format:** Każdy segment = link (oprócz ostatniego, który jest current page)

#### In-Session Navigation:
- Learning Session Header: Zawiera przycisk "Zakończ sesję" (z confirmation)
- Diagnostic Test: Progress indicator "Pytanie 2/5" + przycisk "Następne"

### Mobile Navigation:

**Bottom Tab Bar:**
```
┌────────────────────────────────────────────────────────┐
│                    Main Content                        │
│                                                        │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│   [🏠 Dashboard]   [📊 Progress]   [👤 Profile]       │
└────────────────────────────────────────────────────────┘
```

- Fixed position bottom
- Icons + labels (accessibility)
- Active state highlight

**Hamburger Menu (Post-MVP):**
- Dodatkowe opcje (Help, Contact, Logout)
- Dostępny z top bar (icon w prawym górnym rogu)

### Navigation Flow Summary:

1. **Entry Points:**
   - Landing Page → Login/Register
   - Direct links (email invites, deep links)

2. **Main Hub:**
   - Dashboard - główny punkt po zalogowaniu

3. **Learning Paths:**
   - Dashboard → Section Detail → Diagnostic Test → Results → Learning Session
   - Dashboard → Progress Map → Topic Selection → Learning Session

4. **Utilities:**
   - Profile (dostępny z każdego miejsca via top nav)
   - Logout (z Profile)

5. **Back Navigation:**
   - Browser back button wspierany
   - Breadcrumbs dla orientacji
   - Explicit "Powrót" buttons w krytycznych miejscach (np. po zakończeniu sesji)

---

## 5. Kluczowe komponenty

### 5.1 Komponenty layout

#### `Layout.astro`
**Opis:** Root layout dla wszystkich stron; renderuje HTML structure, head, body.

**Odpowiedzialność:**
- Meta tags (title, description, og:image)
- Global styles import
- Font loading
- Theme initialization script (localStorage → document.classList)
- Navigation mounting point

**Użycie:** Owinięcie wszystkich pages

---

#### `DashboardHeader`
**Opis:** Top navigation bar z logo, głównymi linkami nawigacyjnymi i ikoną profilu.

**Props:**
- `currentPath: string` - do highlightowania aktywnej strony

**Użycie:** Na wszystkich widokach po zalogowaniu (oprócz Learning Session, który ma własny header)

---

#### `Breadcrumb`
**Opis:** Nawigacja ścieżką (Dashboard > Section > Topic).

**Props:**
- `items: Array<{label: string, href?: string}>` - ostatni item bez href (current page)

**Użycie:** Section Detail, Diagnostic Test, Learning Session

---

### 5.2 Komponenty formularzy i inputów

#### `LoginForm`
**Opis:** Formularz logowania z walidacją i obsługą błędów.

**Props:**
- `onSuccess: () => void` - callback po pomyślnym logowaniu

**State:**
- email, password, errors, isSubmitting

**API Calls:** POST /auth/v1/token

**Użycie:** `/auth/login`

---

#### `RegisterForm`
**Opis:** Formularz rejestracji z kodem beta, walidacją i obsługą błędów.

**Props:**
- `onSuccess: () => void` - callback po pomyślnej rejestracji

**State:**
- betaCode, login, email, password, confirmPassword, acceptPolicy, errors, isSubmitting

**API Calls:** POST /auth/v1/signup

**Użycie:** `/auth/register`

---

#### `InputArea` (Learning Session)
**Opis:** Pole wprowadzania wiadomości z przyciskami Wyślij i Głos (MVP: głos disabled).

**Props:**
- `disabled: boolean` - jeśli sesja zakończona
- `onSend: (text: string) => Promise<void>` - callback wysyłania
- `isSending: boolean` - stan wysyłania

**State:**
- text, charCount

**Użycie:** Learning Session widok

---

### 5.3 Komponenty wyświetlania danych

#### `SectionCard`
**Opis:** Karta działu z tytułem, opisem, progress bar i CTA.

**Props:**
- `section: SectionDTO`
- `progress: { completed: number, total: number, percentage: number }`
- `onClick: () => void`

**Użycie:** Dashboard

---

#### `TopicCard`
**Opis:** Karta tematu ze statusem, score, dependencies indicator, CTA.

**Props:**
- `topic: TopicDTO`
- `progress?: UserProgressDTO`
- `isLocked: boolean`
- `onStart: () => void`

**Użycie:** Section Detail, Progress Map

---

#### `MessageItem`
**Opis:** Pojedyncza wiadomość w Learning Session (user lub AI).

**Props:**
- `message: SessionMessageViewModel`

**Renderowanie:**
- Awatar (user: inicjały, ai: ikona)
- Bubble z tekstem (alignment zależny od sender)
- Timestamp
- Opcjonalnie: Audio player (jeśli ai i audio_url)

**Użycie:** MessageList w Learning Session

---

#### `MessageList`
**Opis:** Scrollable lista wiadomości z auto-scroll.

**Props:**
- `messages: SessionMessageViewModel[]`
- `isLoading: boolean`
- `error?: ApiErrorUiModel`
- `onRetry?: () => void`

**Hooks:**
- `useAutoScroll` - scroll do dołu przy nowych wiadomościach

**Użycie:** Learning Session

---

#### `VisualizationPanel`
**Opis:** Panel na wizualizacje (wykresy, wzory).

**Props:**
- `isOpen: boolean`
- `onToggle: () => void`
- `content?: VisualizationItem` (Post-MVP type)

**MVP:** Placeholder "Panel wizualizacji - wkrótce"

**Użycie:** Learning Session

---

#### `ProgressBar`
**Opis:** Wizualizacja postępu (procent ukończenia).

**Props:**
- `value: number` (0-100)
- `label?: string`
- `color?: 'default' | 'success' | 'warning'`

**Użycie:** Dashboard, Section Detail, Progress Map

---

#### `CircularProgress`
**Opis:** Okrągły indicator postępu (np. dla score w test results).

**Props:**
- `value: number` (0-100)
- `size?: 'sm' | 'md' | 'lg'`
- `label?: string`

**Użycie:** Diagnostic Test Results, Progress Map

---

### 5.4 Komponenty statusów i feedbacku

#### `LoadingState`
**Opis:** Skeleton loader lub spinner dla stanów ładowania.

**Props:**
- `type?: 'spinner' | 'skeleton'`
- `message?: string`

**Użycie:** Wszystkie widoki podczas fetch

---

#### `ErrorState`
**Opis:** Wyświetlanie błędów z komunikatem i opcjonalnym retry.

**Props:**
- `code: string | number`
- `message: string`
- `onRetry?: () => void`
- `ctaLabel?: string`
- `ctaAction?: () => void`

**Użycie:** Wszystkie widoki, obsługa 401, 403, 404, 500

---

#### `Toast`
**Opis:** Notification toast dla feedback (sukces, błąd, info).

**Props:**
- `type: 'success' | 'error' | 'info' | 'warning'`
- `message: string`
- `duration?: number`
- `onClose: () => void`

**Użycie:** Cała aplikacja (context provider)

---

#### `Badge`
**Opis:** Mały wskaźnik statusu (not_started, in_progress, completed).

**Props:**
- `status: 'not_started' | 'in_progress' | 'completed'`
- `label?: string`

**Styling:** Kolory (gray, yellow, green) + ikony

**Użycie:** Section Detail, Progress Map, Session Header

---

### 5.5 Komponenty modali i overlays

#### `OnboardingModal`
**Opis:** Modal z krokami tutorialu (3-4 kroki).

**Props:**
- `isOpen: boolean`
- `onComplete: () => void`
- `onSkip: () => void`

**State:**
- currentStep (0-3)

**Użycie:** `/app/onboarding`

---

#### `ConfirmationModal`
**Opis:** Modal z pytaniem i akcjami (Tak/Nie, Potwierdź/Anuluj).

**Props:**
- `isOpen: boolean`
- `title: string`
- `message: string`
- `onConfirm: () => void`
- `onCancel: () => void`
- `confirmLabel?: string`
- `cancelLabel?: string`

**Użycie:** Zakończenie sesji, wylogowanie

---

#### `ReviewModeBar`
**Opis:** Alert bar informujący o trybie powtórkowym.

**Props:**
- `visible: boolean`
- `message?: string` (np. "Tryb powtórki: Ułamki")
- `onExit?: () => void`

**Styling:** Warning color (yellow/orange background)

**Użycie:** Learning Session (conditional)

---

### 5.6 Komponenty UI (shadcn/ui)

**Podstawowe komponenty z biblioteki shadcn/ui:**

- `Button` - przyciski z wariantami (default, outline, ghost, destructive)
- `Card` - kontenery dla treści
- `Input` - pola tekstowe
- `Textarea` - pola wieloliniowe
- `Label` - etykiety dla formularzy
- `Switch` - toggle (theme, audio)
- `Badge` - statusy
- `Alert` - komunikaty (info, warning, error)
- `Skeleton` - loading placeholders
- `Select` - dropdowny (jeśli potrzebne)
- `Tabs` - zakładki (Profile)
- `Accordion` - expandable sections (Progress Map)

**Customizacje:**
- Tailwind classes via `cn()` utility
- Dark mode support (`dark:` variants)
- Polski język (labels, placeholders, messages)

---

### 5.7 Custom hooks

#### `useProfile()`
**Opis:** Fetch i cache profilu użytkownika.

**Returns:**
- `{ data: ProfileViewModel | undefined, loading: boolean, error: ApiErrorUiModel | undefined, refetch: () => void }`

**API:** GET /api/profile

**Użycie:** Profile Settings, Dashboard (dla powitania)

---

#### `useSession(sessionId: string)`
**Opis:** Fetch szczegółów sesji.

**Returns:**
- `{ data: SessionViewModel | null, isLoading: boolean, error: ApiErrorUiModel | undefined, refetch: () => void }`

**API:** GET /api/sessions/{sessionId}

**Użycie:** Learning Session

---

#### `useSessionMessages(sessionId: string, opts?: {limit: number, offset: number})`
**Opis:** Fetch i cache wiadomości sesji.

**Returns:**
- `{ messages: SessionMessageViewModel[], isLoading: boolean, error: ApiErrorUiModel | undefined, fetchMore: () => void, refetch: () => void }`

**API:** GET /api/sessions/{sessionId}/messages

**Użycie:** Learning Session

---

#### `useSendMessage(sessionId: string)`
**Opis:** Mutacja POST wiadomości z optymistycznym dodaniem.

**Returns:**
- `{ sendMessage: (text: string) => Promise<void>, isSending: boolean }`

**API:** POST /api/sessions/{sessionId}/messages

**Logic:**
1. Dodaj optymistycznie do lokalnego state (clientId, isOptimistic: true)
2. POST do API
3. Na sukces: podmiana na wiadomość z serwera
4. Na błąd: rollback + error toast

**Użycie:** Learning Session InputArea

---

#### `useEndSession(sessionId: string)`
**Opis:** Mutacja PUT zakończenia sesji.

**Returns:**
- `{ endSession: (aiSummary?: string) => Promise<void>, isEnding: boolean }`

**API:** PUT /api/sessions/{sessionId}/end

**Logic:**
1. Confirmation modal
2. PUT z ai_summary (jeśli dostępne)
3. Update local state (endedAtIso)
4. Disabled InputArea, pokazanie podsumowania

**Użycie:** Learning Session SessionHeader

---

#### `useAutoScroll(deps: any[])`
**Opis:** Auto-scroll do dołu kontenera przy zmianie dependencies (nowe wiadomości).

**Returns:** void (side effect only)

**Logic:**
- useEffect z scrollIntoView na ostatnim elemencie

**Użycie:** MessageList

---

#### `usePreferences()`
**Opis:** Zarządzanie preferencjami użytkownika (theme, audio) z localStorage.

**Returns:**
- `{ theme: 'light' | 'dark' | 'system', setTheme: (theme) => void, audioEnabled: boolean, setAudioEnabled: (enabled) => void }`

**Logic:**
- Sync z localStorage
- Apply theme do document.documentElement.classList
- Sync z OS theme preference (window.matchMedia)

**Użycie:** Profile Settings, Layout (initial theme)

---

## 6. Mapowanie User Stories do widoków

| ID | User Story | Widoki | Komponenty kluczowe | Endpointy API |
|----|-----------|--------|---------------------|---------------|
| US-001 | Rejestracja z kodem beta | Register | RegisterForm, Input, Button | POST /auth/v1/signup |
| US-002 | Logowanie | Login | LoginForm, Input, Button | POST /auth/v1/token |
| US-003 | Samouczek wprowadzający | Onboarding Tutorial | OnboardingModal, ProgressIndicator | PUT /api/profile |
| US-004 | Rozpoczęcie działu z testem | Dashboard → Section Detail → Diagnostic Test | SectionCard, DiagnosticTestCard, QuestionCard | GET /api/sections, POST /api/diagnostic-test-attempts |
| US-005 | Lekcja głosowa z AI | Learning Session | MessageList, MessageItem, InputArea (mic button) | POST /api/sessions, POST/GET /api/sessions/{id}/messages |
| US-006 | Wprowadzanie wzorów | Learning Session | InputArea (textarea z obsługą notacji matematycznej) | POST /api/sessions/{id}/messages |
| US-007 | Prośba o wizualizację | Learning Session | VisualizationPanel, MessageItem (AI response) | POST /api/sessions/{id}/messages + backend AI logic |
| US-008 | Proaktywna wizualizacja | Learning Session | VisualizationPanel (auto-open), AI message | Backend AI logic → POST /api/sessions/{id}/messages |
| US-009 | Identyfikacja braku wiedzy | Learning Session | MessageItem (AI propozycja), ConfirmationModal | Backend AI logic → GET /api/topics/{id}/dependencies |
| US-010 | Sesja powtórkowa | Learning Session | ReviewModeBar, nowa sub-session logic | POST /api/sessions (nowa sesja dla dependency topic) |
| US-011 | Śledzenie postępów | Progress Map | SectionsAccordion, TopicProgressCard, ProgressBar | GET /api/user-progress |
| US-012 | Obsługa niejasnych pytań | Learning Session | MessageItem (AI redirect do tematu) | Backend AI logic |

---

## 7. Punkty bólu użytkownika i rozwiązania UI

### Problem 1: Strach przed oceną (PRD sekcja 2)

**Opis problemu:** Uczniowie krępują się zadawać "proste" pytania w grupie z obawy przed oceną ze strony nauczyciela lub rówieśników.

**Rozwiązania UI:**
- **Prywatna przestrzeń nauki:** Brak rankingów, porównań z innymi w MVP (solo experience)
- **Pozytywny feedback:** AI zawsze zachęcający, brak "czerwonych X" przy błędach; zamiast tego "Spróbujmy inaczej" lub "Dobra próba! Poprawny wynik to..."
- **Neutralne statusy:** Badges w Progress Map używają neutralnych kolorów i komunikatów ("W trakcie", nie "Nie zdałeś")
- **Podsumowanie AI:** Sesja kończy się podsumowaniem AI z naciskiem na postępy, nie braki

---

### Problem 2: Niezidentyfikowane braki w wiedzy (PRD sekcja 2)

**Opis problemu:** Trudności z bieżącym materiałem często wynikają z zaległości na wcześniejszych etapach. Uczniom trudno jest samodzielnie zdiagnozować i uzupełnić te braki.

**Rozwiązania UI:**
- **Test diagnostyczny:** Przed każdym działem (US-004) ocenia poziom i dostosowuje start point
- **Proaktywne propozycje AI:** Gdy AI wykryje błąd wynikający z braku wiedzy fundamentalnej, proponuje mini-sesję powtórkową (US-009)
- **ReviewModeBar:** Jasno komunikuje kontekst powtórki ("Tryb powtórki: Ułamki - Po zakończeniu wrócimy do tematu głównego")
- **Dependencies indicator:** W Section Detail pokazanie zależności między tematami (soft lock z tooltipem "Ten temat wymaga: Ułamki")
- **Progress Map:** Wizualizacja wszystkich braków (tematy not_started z niskim score w dependencies)

---

### Problem 3: Ograniczona dostępność pomocy (PRD sekcja 2)

**Opis problemu:** Dostęp do nauczyciela lub korepetytora jest ograniczony czasowo i finansowo. Uczniowie potrzebują natychmiastowej odpowiedzi podczas samodzielnej nauki.

**Rozwiązania UI:**
- **24/7 dostępność Learning Session:** Brak limitów czasowych w becie, zawsze można rozpocząć nową sesję
- **Instant feedback:** Wiadomości AI generowane w czasie rzeczywistym (<3s zgodnie z PRD), loading indicators dla transparentności
- **Brak barier:** Nie ma limitów liczby pytań, długości sesji (w MVP); user może zadawać pytania w nieskończoność
- **Quick actions:** W Progress Map i Dashboard - szybkie rozpoczęcie/kontynuacja bez zbędnych kroków

---

### Problem 4: Brak indywidualizacji (PRD sekcja 2)

**Opis problemu:** Standardowe lekcje operują na jednym, uśrednionym poziomie, nie uwzględniając różnych potrzeb uczniów.

**Rozwiązania UI:**
- **Test diagnostyczny:** Dostosowuje początek nauki do poziomu ucznia (US-004), wyniki prezentowane w Diagnostic Test Results z rekomendacją
- **Progress Map:** Indywidualna ścieżka każdego ucznia widoczna (nie ma "standardowej ścieżki" narzuconej w UI)
- **Adaptacyjna trudność:** Backend AI logic + UI pokazuje efekty (AI proponuje łatwiejsze/trudniejsze zadania w sesji)
- **Flexible navigation:** User może wybrać dowolny temat (soft lock, nie hard block), ale AI sugeruje optymalną ścieżkę

---

### Problem 5: Motywacja i ciągłość nauki

**Opis problemu:** Trudność w utrzymaniu regularności nauki, brak wizualizacji postępów.

**Rozwiązania UI:**
- **Progress Map:** Wizualna mapa wszystkich działów i tematów z badges, scores, progress bars
- **AI Summary:** Po każdej sesji AI podsumowuje osiągnięcia ("Dzisiaj nauczyłeś się funkcji liniowych, rozwiązałeś 5 zadań poprawnie!")
- **Quick stats:** Dashboard pokazuje ostatnią sesję (data, temat), ogólny postęp (X/Y ukończone)
- **Streak indicator (Post-MVP):** Dni z rzędu nauki (gamification element)
- **Completed badges:** Zielone checkmarki ✓ dla ukończonych tematów dają poczucie osiągnięcia

---

### Problem 6: Skomplikowane wzory matematyczne

**Opis problemu:** Trudność w zapisie i zrozumieniu złożonych wzorów matematycznych.

**Rozwiązania UI:**
- **Textarea z przykładami:** InputArea ma placeholder "Wpisz pytanie lub wzór matematyczny (np. x^2 + 3x - 5)..." - pokazuje proste zapisy
- **VisualizationPanel:** Graficzne przedstawienie wzorów (LaTeX render) i wykresów funkcji
- **AI pomoc:** Jeśli user źle zapisze wzór, AI proponuje poprawkę ("Czy chodziło Ci o x^2 + 3x - 5?")
- **Post-MVP: WYSIWYG editor:** Edytor równań z podglądem na żywo (jak Notion math block)

---

## 8. Responsywność i accessibility

### Responsive breakpoints:

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md-lg)
- **Desktop:** > 1024px (xl)

### Responsive strategies:

- **Layout:**
  - Mobile: Single column, stacked components
  - Tablet: 2 columns gdzie sensowne (Section grid)
  - Desktop: 3 columns, więcej whitespace

- **Navigation:**
  - Mobile: Bottom tab bar (icons only)
  - Desktop: Top bar z tekstem

- **Learning Session:**
  - Mobile: Stacked (Messages on top, Visualization collapsible)
  - Desktop: 2-column (Messages left, Visualization right)

- **Typography:**
  - Mobile: Mniejsze fonty (base 14px)
  - Desktop: Większe fonty (base 16px)

### Accessibility (WCAG 2.1 AA):

- **Semantic HTML:** header, main, nav, section, article, footer
- **Headings hierarchy:** h1 (page title) → h2 (sections) → h3 (subsections)
- **ARIA landmarks:** role="navigation", role="main", role="complementary"
- **ARIA live regions:** Dla dynamic content (new AI messages, errors)
- **Keyboard navigation:**
  - Tab order logiczny
  - Focus indicators widoczne
  - Shortcuts (Enter = submit, Esc = close modal)
- **Color contrast:** Min 4.5:1 dla tekstu, 3:1 dla UI elements
- **Alt text:** Wszystkie obrazy i ikony
- **Form labels:** Wszystkie inputs z <label> lub aria-label
- **Error announcements:** ARIA assertive dla błędów krytycznych
- **Skip links:** "Skip to main content" (especially for screen readers)

---

## 9. Performance considerations

### Strategie optymalizacji:

- **Code splitting:** Dynamic imports dla heavy components (VisualizationPanel, Charts)
- **Lazy loading:** Images z loading="lazy", React.lazy dla routes
- **Caching:** API responses z Cache-Control headers (sections, topics - 1h)
- **Debouncing:** Input fields (textarea w Learning Session) - debounce 300ms przed validation
- **Pagination:** Sessions list, messages list (limit 50, offset-based)
- **Optimistic updates:** Send message instant feedback (rollback on error)
- **Bundle size:** Tree-shaking, tylko używane shadcn/ui components
- **SSR:** Astro server-side rendering dla initial load (fast FCP)
- **Images:** WebP format, responsive sizes, CDN (post-MVP)

### Performance budgets (MVP targets):

- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Bundle size:** < 300KB gzipped (main bundle)

---

## 10. Bezpieczeństwo w UI

### Client-side security measures:

- **Input sanitization:** Przed renderowaniem user-generated content (XSS prevention)
- **CSRF protection:** Supabase handles via JWT tokens
- **httpOnly cookies:** Tokeny auth nie dostępne dla JavaScript (middleware handles)
- **Content Security Policy (CSP):** Headers w produkcji (no inline scripts)
- **Rate limiting:** Handled server-side, ale UI pokazuje friendly messages przy 429
- **Validation:** Wszystkie inputy walidowane client-side + server-side (defense in depth)
- **Secure redirects:** Redirect po loginu tylko do własnych ścieżek (whitelist)
- **Password visibility toggle:** User choice, ale domyślnie hidden
- **Session timeout:** Auto-redirect do loginu po wygaśnięciu (middleware)
- **Error messages:** Nie ujawniać szczegółów technicznych (generic "Wystąpił błąd")

---

## 11. Podsumowanie architektury UI

Architektura UI dla AI Tutor Matematyki została zaprojektowana z myślą o trzech głównych celach PRD:

1. **Adaptacyjność** - Interfejs wspiera mechanizm adaptacyjnej nauki przez testy diagnostyczne, graf wiedzy (dependencies), i proaktywne propozycje AI
2. **Konwersacyjność** - Centralna rola Learning Session z focus na natural conversation (text + voice), wizualizacje, i cierpliwego AI tutora
3. **Transparentność** - Progress Map i Dashboard dają uczniom jasny obraz ich postępów, motywując do dalszej nauki

### Kluczowe decyzje architektoniczne:

- **Astro + React islands:** SSR dla performance, React dla interaktywnych części (sesje, formularze)
- **Tailwind + shadcn/ui:** Spójny design system, accessibility built-in
- **Cookie-based auth:** Middleware z Supabase session restoration, httpOnly cookies
- **Three-tier types:** Entity → DTO → ViewModel dla type safety i separation of concerns
- **Optimistic updates:** Instant feedback w Learning Session (send message)
- **Mobile-first responsive:** Bottom tab bar, stacked layouts, progressive enhancement

### MVP scope:

- 12 głównych widoków (Landing → Register → Login → Onboarding → Dashboard → Section Detail → Diagnostic Test → Test Results → Learning Session → Progress Map → Profile → Error States)
- ~25 kluczowych komponentów (reusable)
- 8 custom hooks (data fetching, state management)
- Full accessibility (WCAG 2.1 AA)
- Polski język we wszystkich komunikatach

### Post-MVP enhancements:

- Voice input (VAD, continuous conversation)
- Advanced visualizations (Manim integration)
- Gamification (achievements, streaks, leaderboards)
- Social features (study groups)
- Photo upload (OCR dla zadań)
- Mobile apps (React Native)

---

**Dokument wersja:** 1.0
**Data:** 2025-10-28
**Status:** Draft - MVP Planning
