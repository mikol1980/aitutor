# Profile View Components

Komponenty widoku profilu użytkownika z zarządzaniem preferencjami UI.

## Struktura komponentów

### ProfileScreen (główny kontener)
- Zarządza stanem profilu i preferencji
- Obsługuje loading/error states
- Integruje wszystkie komponenty potomne

### Komponenty prezentacyjne

#### ProfileHeader
Nagłówek widoku z tytułem i opcjonalną personalizacją.

#### ProfileDetailsCard
Karta z informacjami o koncie:
- Login
- Email
- Status samouczka (badge)
- Data utworzenia konta

#### PreferencesForm
Formularz zarządzania preferencjami UI:
- Wybór motywu (ThemeToggle)
- Przełącznik audio (AudioToggle)
- Przycisk reset

#### TutorialSection
Sekcja z informacją o samouczku i linkiem do `/onboarding`.

### Komponenty wspólne

#### LoadingState
Stan ładowania z szkieletami lub spinnerem.

#### ErrorState
Wyświetlanie błędów z opcją retry.

## Hooki

### useProfile
Pobiera dane profilu z API `/api/profile`:
- Automatyczny fetch przy montowaniu
- Obsługa błędów (401, 404, 500)
- Mechanizm retry (max 3 próby)
- Zwraca: `{ data, loading, error, refetch, canRetry }`

### usePreferences
Zarządza preferencjami UI w localStorage:
- Automatyczna aplikacja motywu dark/light/system
- Nasłuchiwanie zmian preferencji systemowych
- Persistencja w localStorage
- Zwraca: `{ preferences, setPreferences, resetPreferences }`

## API Client

### fetchProfile()
Pobiera profil użytkownika z autoryzacją JWT Bearer.

**Wymaga:**
- `PUBLIC_SUPABASE_URL` - URL Supabase
- `PUBLIC_SUPABASE_ANON_KEY` - klucz publiczny Supabase

**Zwraca:** `ProfileViewModel`

**Rzuca:** `ApiErrorUiModel` przy błędach

## Storage

Preferencje przechowywane w localStorage:
- `aitutor:theme` - motyw (system/light/dark)
- `aitutor:audioEnabled` - status audio (true/false)

## Użycie

```astro
---
// src/pages/app/profile.astro
import Layout from '@/layouts/Layout.astro';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
---

<Layout title="Profil — AI Tutor">
  <main>
    <ProfileScreen client:load />
  </main>
</Layout>
```

## Dostępność

- ARIA labels na wszystkich kontrolkach
- Focus states dla nawigacji klawiaturą
- Kontrast kolorów zgodny z WCAG
- Komunikaty błędówczytelne dla screen readers

## Responsywność

- Mobile-first design
- Grid layout: 1 kolumna (mobile) → 2 kolumny (lg+)
- Elastyczne komponenty dostosowujące się do szerokości

