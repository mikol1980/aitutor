# Architektura UI dla AI Tutor (MVP)

## 1. Przegląd struktury UI

AI Tutor jest aplikacją webową opartą o Astro (SSR) i React (interaktywność klienta). UI organizuje naukę w trzech głównych poziomach nawigacji: Dashboard → Sekcja → Sesja nauki. Interfejs konwersacyjny jest stale dostępny w widoku Sesji, bez zasłaniania obszaru wizualizacji. Wszystkie widoki stosują zasady dostępności WCAG 2.1 AA, bezpiecznego obchodzenia się z danymi (JWT via Supabase, RLS po stronie DB), spójne wzorce ładowania/błędów oraz responsywny layout oparty na Tailwind.

## 2. Lista widoków

### 2.1. Landing / Logowanie / Rejestracja
- **Ścieżka widoku**: `/` (landing), `/auth/login`, `/auth/register`
- **Główny cel**: Uwierzytelnienie użytkownika (Supabase Auth) i dostęp do bety (kod dostępu); wprowadzenie do produktu.
- **Kluczowe informacje do wyświetlenia**:
  - Formularz logowania (email/hasło), link do rejestracji i reset hasła
  - Rejestracja z polem „kod dostępu do bety” (walidacja klient/serwer)
  - Krótkie objaśnienie korzyści i zasad prywatności
- **Kluczowe komponenty widoku**:
  - Formy z walidacją (React Hook Form + Zod)
  - Komponent komunikatów błędów i stanów ładowania
  - Banner z informacją o prywatności i polityce cookies
- **UX, dostępność i względy bezpieczeństwa**:
  - Klawiaturowa nawigacja, etykiety formularzy, `aria-live` dla błędów
  - Brak przechowywania tokenów w localStorage (access w pamięci, refresh httpOnly cookie)
  - Weryfikacja kodu dostępu po stronie serwera; bezpieczne komunikaty o błędach

### 2.2. Tutorial Onboarding (4 kroki)
- **Ścieżka widoku**: `/onboarding`
- **Główny cel**: Szybkie wprowadzenie do obsługi AI konwersacyjnego, wprowadzania wzorów i mapy postępów; ustawienie flagi profilu `has_completed_tutorial`.
- **Kluczowe informacje do wyświetlenia**:
  - 4 kroki z mikro-interakcjami (demo konwersacji, pole wzorów, mapa postępu)
  - Możliwość pominięcia po kroku 2 i powrotu później
- **Kluczowe komponenty widoku**:
  - Progress bar kroków, przyciski „Dalej”, „Pomiń”
  - Po zakończeniu wywołanie aktualizacji profilu
- **UX, dostępność i względy bezpieczeństwa**:
  - Anonsowanie zmiany kroku w `aria-live`
  - Zapisywanie postępu kroku w sessionStorage (odporność na odświeżenie)
  - Aktualizacja profilu wyłącznie po zgodzie użytkownika (świadome kliknięcie)

### 2.3. Dashboard
- **Ścieżka widoku**: `/app`
- **Główny cel**: Przegląd działów (Sekcji), skróty do „Kontynuuj ostatnią sesję”, szybki dostęp do „Moje postępy”.
- **Kluczowe informacje do wyświetlenia**:
  - Karty Sekcji z opisem i wskaźnikiem postępu
  - „Kontynuuj ostatnią sesję” (jeśli jest aktywna/ostatnia zakończona)
  - Skrót do profilu/ustawień
- **Kluczowe komponenty widoku**:
  - Lista kart Sekcji (cache’owana 1h)
  - Komponent skrótów (ostatnia sesja, rekomendowany temat)
- **UX, dostępność i względy bezpieczeństwa**:
  - Skeletony wczytywania, czytelny kontrast, duże hit-targets na mobile
  - Tylko zasoby uwierzytelnione; brak wycieków danych w stanie niezalogowanym

### 2.4. Widok Sekcji (lista tematów + diagnostyka)
- **Ścieżka widoku**: `/app/sections/:sectionId`
- **Główny cel**: Prezentacja tematów z zależnościami, możliwość uruchomienia testu diagnostycznego.
- **Kluczowe informacje do wyświetlenia**:
  - Lista tematów w kolejności, statusy i zależności (🔒/⚠️/✓)
  - CTA: „Rozpocznij test diagnostyczny” dla sekcji
- **Kluczowe komponenty widoku**:
  - Lista tematów z ikonami statusu i informacją o zależnościach
  - Baner informacyjny o teście diagnostycznym
- **UX, dostępność i względy bezpieczeństwa**:
  - Opisy ikon dla czytników ekranu (aria-label)
  - Zabezpieczenie przed wejściem w temat bez potrzebnej kontekstowej informacji (soft-lock + rekomendacje)

### 2.5. Test diagnostyczny (flow wieloetapowy)
- **Ścieżka widoku**: `/app/sections/:sectionId/diagnostic`
- **Główny cel**: Szybka ocena poziomu ucznia i ustawienie punktu startowego nauki.
- **Kluczowe informacje do wyświetlenia**:
  - Ekran wprowadzający, pytania po jednym na ekran, pasek postępu
  - Ekran „Analizuję odpowiedzi…”, wyniki i rekomendacja startowa
- **Kluczowe komponenty widoku**:
  - Komponent pytania (multiple choice/short answer) z walidacją i nawigacją
  - Pasek postępu i potwierdzenia działań
- **UX, dostępność i względy bezpieczeństwa**:
  - Obsługa klawiatury (radiobuttony), wyraźne focus styles
  - Brak możliwości pominięcia pytania (jasna informacja)
  - Odporność na odświeżenie (stan w sessionStorage); ochrona przed utratą danych

### 2.6. Widok Tematu (szczegóły + materiały)
- **Ścieżka widoku**: `/app/topics/:topicId`
- **Główny cel**: Przegląd informacji o temacie i dostęp do materiałów (wytłumaczenia, ćwiczenia) oraz rozpoczęcia sesji.
- **Kluczowe informacje do wyświetlenia**:
  - Tytuł, opis, zależności, materiały (filtrowalne po typie)
  - Status postępu dla tematu
- **Kluczowe komponenty widoku**:
  - Lista materiałów (verified domyślnie), filtr „typ”
  - CTA „Rozpocznij sesję nauki”
- **UX, dostępność i względy bezpieczeństwa**:
  - Lazy loading treści, sekcje semantyczne, opisy linków
  - Brak wyświetlania niezweryfikowanej treści w produkcji

### 2.7. Sesja Nauki (główny widok konwersacyjny)
- **Ścieżka widoku**: `/app/sessions/:sessionId`
- **Główny cel**: Płynna konwersacja z AI, dynamiczne wizualizacje, wykrywanie braków i „cofanie się”, zakończenie z podsumowaniem.
- **Kluczowe informacje do wyświetlenia**:
  - Nagłówek sesji (temat, czas, zakończ)
  - Obszar konwersacji (lista wiadomości: użytkownik/AI, tekst, wzory, audio)
  - Panel wizualizacji (kolidowalny panel boczny/obszar centralny)
  - Pole wprowadzania tekstu/wzorów + przycisk głosowy
  - Pasek trybu powtórki (review mode)
- **Kluczowe komponenty widoku**:
  - `SessionHeader`, `MessageList` (auto-scroll), `MessageItem` (typy: text/math/audio)
  - `VisualizationPanel` (collapsible, fullscreen via portal)
  - `InputArea` (LaTeX/notacja prosta + VoiceButton)
  - `ReviewModeBar` (żółty wskaźnik, kontekst powrotu)
- **UX, dostępność i względy bezpieczeństwa**:
  - `aria-live` dla odpowiedzi AI, synchronizacja transkrypcji
  - Ochrona przed utratą wiadomości (IndexedDB offline queue dla wysyłek)
  - Brak cache dla wiadomości sesyjnych; ostrożne logowanie

### 2.8. Moje postępy (przegląd i szczegóły)
- **Ścieżka widoku**: `/app/progress`
- **Główny cel**: Wgląd w postęp we wszystkich sekcjach i tematach, z podsumowaniami i statusami.
- **Kluczowe informacje do wyświetlenia**:
  - Karty Sekcji z procentem ukończenia, listy tematów ze statusami i wynikami
  - Podsumowanie agregatów (completed/in_progress/not_started)
- **Kluczowe komponenty widoku**:
  - Widok przeglądowy + szczegóły sekcji z tabelą/akordeonem tematów
- **UX, dostępność i względy bezpieczeństwa**:
  - Czytelne oznaczenia kolorów + tekstowe opisy statusów
  - Responsywne tabele/listy, focus management przy rozwijaniu

### 2.9. Profil i Ustawienia
- **Ścieżka widoku**: `/app/profile`
- **Główny cel**: Zarządzanie preferencjami UI (motyw, audio), dostęp do tutoriala, przegląd danych profilu.
- **Kluczowe informacje do wyświetlenia**:
  - Login, email, preferencje (motyw, audio), status tutoriala
- **Kluczowe komponenty widoku**:
  - Formularz preferencji z natychmiastowym podglądem (theme toggle)
  - Sekcja „Powtórz tutorial” (link do `/onboarding`)
- **UX, dostępność i względy bezpieczeństwa**:
  - Wyraźne etykiety i opisy, bezpieczne zapisywanie preferencji
  - Brak wrażliwych danych w localStorage (tylko nieszkodliwe preferencje)

### 2.10. Strony stanów i błędów (globalne)
- **Ścieżki widoku**: `/error`, interceptory w kontekście aplikacji
- **Główny cel**: Jednolite komunikaty dla stanów: nieautoryzowany, sieć offline, rate limit, brak zasobu.
- **Kluczowe informacje do wyświetlenia**:
  - Komunikat błędu, opcje retry, kontakt/feedback, link powrotu
- **Kluczowe komponenty widoku**:
  - Globalny toster powiadomień, placeholdery skeletonów, retry z backoff
- **UX, dostępność i względy bezpieczeństwa**:
  - `aria-live` dla błędów, focus na komunikaty
  - Ograniczenie ujawniania szczegółów błędów (bez wrażliwych danych)

## 3. Mapa podróży użytkownika

### Główny przepływ: Od logowania do aktywnej sesji z adaptacją
1) Użytkownik trafia na `/auth/login` i loguje się (lub rejestruje z kodem bety).
2) Jeśli `has_completed_tutorial=false` → redirect do `/onboarding` (4 kroki, możliwość „Pomiń” po kroku 2) → aktualizacja profilu.
3) Przejście do `/app` (Dashboard) → wybór Sekcji.
4) Na `/app/sections/:sectionId` użytkownik może uruchomić test diagnostyczny:
   - `/app/sections/:sectionId/diagnostic`: pytania → wyniki → rekomendacja pierwszego tematu.
5) Użytkownik przechodzi do `/app/topics/:topicId` i rozpoczyna sesję, która tworzy nową sesję i przekierowuje do `/app/sessions/:sessionId`.
6) W Sesji: rozmowa + wizualizacje; AI wykrywa brak → proponuje „review mode” (mini-lekcja), po zakończeniu powrót do kontekstu.
7) Zakończenie sesji → podsumowanie AI, aktualizacja postępu; nawigacja do `/app/progress` lub powrót na Dashboard.

### Alternatywne ścieżki
- „Kontynuuj ostatnią sesję” z Dashboard → bezpośrednio do `/app/sessions/:sessionId`.
- Przegląd postępów z `/app/progress` i nawigacja do konkretnego tematu.
- Wejście do Ustawień z dowolnego miejsca (menu globalne) i powrót do poprzedniego widoku.

## 4. Układ i struktura nawigacji

- **Poziom 1 (Globalny)**: AppShell z nagłówkiem (logo, profil, menu) i nawigacją boczną (desktop) / menu hamburger (mobile).
- **Poziom 2 (Sekcje/Tematy)**: Widoki przeglądowe (Dashboard, Sekcja, Postępy, Profil) – SSR + hydratacja.
- **Poziom 3 (Flow reaktywny)**: Test diagnostyczny i Sesja – tryb SPA (React), z zachowaniem stanu i płynnymi przejściami.
- **Dostępność**: Landmarki ARIA (`header`, `nav`, `main`, `aside`, `footer`), skip links, logiczna kolejność fokusów.
- **Responsywność**: Mobile-first, siatka CSS (Grid/Flex), adaptacyjne panele (wizualizacje jako panel dokowany/pełny ekran).

## 5. Kluczowe komponenty (wielokrotnego użytku)

- **AppShell**: layout z nawigacją i responsywnymi panelami.
- **SectionCard / TopicListItem**: karty i wiersze list z ikonami statusu i zależnościami.
- **DependencyBadge**: prezentacja zależności tematu (z opisem ARIA).
- **ProgressBar / ProgressSummary**: wskaźniki postępu sekcji i agregaty.
- **DiagnosticQuestion**: uniwersalny komponent pytania (MC/short answer) z walidacją i obsługą klawiatury.
- **SessionHeader / MessageList / MessageItem**: podstawowe elementy konwersacji, auto-scroll, typy wiadomości.
- **VisualizationPanel**: dock/undock, fullscreen przez portal, skeleton loader, aria-descriptions.
- **InputArea (Text + Math + VoiceButton)**: wprowadzanie tekstu i wzorów (rendering math), nagrywanie głosowe (progressive enhancement).
- **ReviewModeBar**: wskaźnik trybu powtórki z kontekstem i możliwością wyjścia/powrotu.
- **Notifications (Toast)**: spójne komunikaty sukces/błąd/info, `aria-live`.
- **ErrorBoundary / RetryButton**: przechwytywanie błędów, retry z backoff.

## 6. Powiązanie z API (zgodność i mapowanie)

- **Profil**: `GET/PUT /api/profile` (ustawienie `has_completed_tutorial`, dane usera).
- **Struktura wiedzy**: `GET /api/sections`, `GET /api/sections/{id}`, `GET /api/sections/{id}/topics`, `GET /api/topics/{id}`, `GET /api/topics/{id}/dependencies`, `GET /api/topics/{id}/content` (domyślnie verified).
- **Diagnostyka**: `GET /api/sections/{id}/diagnostic-test`, `POST /api/diagnostic-test-attempts`, `POST /api/user-answers`, `PUT /api/diagnostic-test-attempts/{id}/complete`.
- **Sesje**: `POST /api/sessions`, `GET /api/sessions`, `GET /api/sessions/{id}`, `POST /api/sessions/{id}/messages`, `GET /api/sessions/{id}/messages`, `PUT /api/sessions/{id}/end`.
- **Postęp**: `GET /api/user-progress`, `GET/PUT /api/user-progress/{topicId}`, `GET /api/sections/{sectionId}/progress`.
- **Standardy**: paginacja (limit/offset), rate limiting (nagłówki), jednolity format błędów.

## 7. Przypadki brzegowe i stany błędów

- **Nieautoryzowany / wygasły token**: globalny interceptor → redirect do `/auth/login`, zachowanie powrotu po zalogowaniu.
- **Rate limit (429)**: wyświetlenie komunikatu z `retry_after`, automatyczny retry po odczekaniu.
- **Offline / utrata sieci**: wskaźnik statusu sieci, kolejka wiadomości do wysłania (IndexedDB), ograniczenie UI.
- **Przerwana diagnostyka**: ostrzeżenie przed wyjściem, zachowanie postępu w sessionStorage.
- **Duże treści wizualizacji**: skeletony, lazy render, tryb pełnoekranowy bez utraty kontekstu.
- **Brak danych / 404**: przyjazny ekran „brak zasobu” z nawigacją wstecz.

## 8. Mapowanie historyjek użytkownika (PRD → UI)

- **US-001 Rejestracja z kodem dostępu** → Widok Auth (Rejestracja), walidacja kodu, komunikaty błędów.
- **US-002 Logowanie** → Widok Auth (Login), obsługa błędów i resetu hasła.
- **US-003 Tutorial** → Widok Onboarding (4 kroki), zapis `has_completed_tutorial`.
- **US-004 Rozpoczęcie działu** → Widok Sekcji, informacja o teście diagnostycznym, przejście do diagnostyki.
- **US-005 Prowadzenie lekcji z AI** → Widok Sesji: wejście/wyjście audio, transkrypcja, płynny dialog.
- **US-006 Wprowadzanie wzorów** → `InputArea` z renderingiem matematycznym i potwierdzeniem AI.
- **US-007 Prośba o wizualizację** → `VisualizationPanel`, komenda tekstowa/głosowa, opis osi.
- **US-008 Proaktywna wizualizacja** → Reguły UI: auto-wyświetlenie w panelu z opisem.
- **US-009 Identyfikacja braku wiedzy** → `ReviewModeBar`, propozycja mini-sesji powtórkowej.
- **US-010 Sesja powtórkowa** → Lightweight flow w obrębie Sesji z kontekstem powrotu.
- **US-011 Śledzenie postępów** → Widok „Moje postępy” (overview + detail).
- **US-012 Off-topic pytania** → Odpowiedzi zgodne z osobowością AI, redirect rozmowy na temat (komponent polityki odpowiedzi).

## 9. Wymagania → elementy UI (mapowanie)

- **Adaptacyjna nauka** → Test diagnostyczny + Dependencies + Review mode w Sesji.
- **Interfejs konwersacyjny** → Stały `ConversationArea`, `InputArea`, `VisualizationPanel`.
- **Generowanie wizualizacji** → Panel wizualizacji + dostępne komendy + opisy ARIA.
- **Śledzenie postępów** → „Moje postępy” + progress summary na Dashboard/Sekcja.
- **Dostęp do bety** → Rejestracja z kodem (serwerowa walidacja) i bezpieczne komunikaty.
- **Polityka prywatności** → Banner/sekcja informacyjna, linki do dokumentów, minimalizacja danych w pamięci przeglądarki.


