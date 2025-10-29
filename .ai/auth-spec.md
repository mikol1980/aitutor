# Specyfikacja Techniczna: Moduł Autentykacji AI Tutor

## 1. WPROWADZENIE

### 1.1. Zakres dokumentu

Niniejszy dokument definiuje szczegółową architekturę techniczną modułu autentykacji dla aplikacji AI Tutor. Specyfikacja obejmuje:
- Rejestrację użytkowników z systemem kodów dostępu (beta)
- Logowanie użytkowników
- Wylogowanie
- Odzyskiwanie hasła
- Ochronę zasobów aplikacji
- Zarządzanie sesją użytkownika

Dokument realizuje wymagania funkcjonalne US-001 i US-002 z dokumentu PRD.

### 1.2. Kontekst techniczny

**Stack technologiczny:**
- Frontend: Astro 5 (SSR), React 19, TypeScript 5, Tailwind 4
- Backend: Astro API Routes, Supabase (PostgreSQL + Auth)
- Autentykacja: Supabase Auth (JWT)

**Istniejąca infrastruktura:**
- Baza danych z tabelą `profiles` połączoną z `auth.users` przez trigger
- Middleware Astro udostępniające `context.locals.supabase`
- System typów z `database.types.ts` i `types.ts`
- Wzorzec API endpoints z walidacją Bearer tokens

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Struktura stron i routing

#### 2.1.1. Nowe strony Astro (SSR)

**Lokalizacja:** `src/pages/auth/`

##### `/auth/login` - Strona logowania
```
src/pages/auth/login.astro
```

**Cel:** Główny punkt wejścia dla uwierzytelniania użytkowników.

**Odpowiedzialność strony:**
- Server-side: Sprawdzenie czy użytkownik jest już zalogowany (redirect do `/app/dashboard`)
- Renderowanie layoutu z osadzonym komponentem React `LoginForm`
- SEO meta tags i title
- Obsługa query params (np. `?redirect=/app/profile` dla powrotu po logowaniu)
- Pre-gate bety: pole na „kod dostępu” z walidacją onBlur; po poprawnej walidacji CTA „Załóż konto” prowadzi do `/auth/register?code=...`

**Struktura:**
```astro
---
// Server-side logic
import Layout from '@/layouts/Layout.astro';
import { LoginForm } from '@/components/auth/LoginForm';

// Check if already authenticated
const { locals } = Astro;
const { data: { session } } = await locals.supabase.auth.getSession();

// Redirect authenticated users to dashboard
if (session) {
  return Astro.redirect('/app/dashboard');
}

// Get redirect parameter from query string
const redirectTo = Astro.url.searchParams.get('redirect') || '/app/dashboard';
---

<Layout title="Logowanie — AI Tutor">
  <main class="min-h-screen flex items-center justify-center bg-background">
    <LoginForm client:load redirectTo={redirectTo} />
  </main>
</Layout>
```

**Kryteria akceptacji:**
- Przekierowanie zalogowanych użytkowników do dashboardu
- Przekazanie parametru `redirectTo` do komponentu React
- Brak mигания zawartości (flash of unauthenticated content)

---

##### `/auth/register` - Strona rejestracji
```
src/pages/auth/register.astro
```

**Cel:** Rejestracja nowych użytkowników w zamkniętej wersji beta z użyciem kodu dostępu.

**Odpowiedzialność strony:**
- Server-side: Sprawdzenie czy użytkownik jest już zalogowany (redirect)
- Renderowanie formularza rejestracyjnego
- Obsługa query param `?code=` dla pre-wypełnienia kodu dostępu

**Struktura:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { RegisterForm } from '@/components/auth/RegisterForm';

const { locals } = Astro;
const { data: { session } } = await locals.supabase.auth.getSession();

if (session) {
  return Astro.redirect('/app/dashboard');
}

const prefilledCode = Astro.url.searchParams.get('code') || '';
---

<Layout title="Rejestracja — AI Tutor">
  <main class="min-h-screen flex items-center justify-center bg-background">
    <RegisterForm client:load prefilledCode={prefilledCode} />
  </main>
</Layout>
```

---

##### `/auth/reset-password` - Strona resetowania hasła
```
src/pages/auth/reset-password.astro
```

**Cel:** Umożliwienie użytkownikom zresetowania zapomnianego hasła.

**Odpowiedzialność strony:**
- Renderowanie formularza żądania resetu hasła (wprowadzenie email)
- Obsługa query param `?sent=true` dla wyświetlenia komunikatu potwierdzenia

**Struktura:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

const emailSent = Astro.url.searchParams.get('sent') === 'true';
---

<Layout title="Resetowanie hasła — AI Tutor">
  <main class="min-h-screen flex items-center justify-center bg-background">
    <ResetPasswordForm client:load emailSent={emailSent} />
  </main>
</Layout>
```

---

##### `/auth/update-password` - Strona ustawiania nowego hasła
```
src/pages/auth/update-password.astro
```

**Cel:** Umożliwienie użytkownikowi ustawienia nowego hasła po kliknięciu w link z emaila.

**Odpowiedzialność strony:**
- Server-side: Weryfikacja tokenu resetowania z query params
- Renderowanie formularza ustawiania nowego hasła

**Struktura:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm';

// Supabase automatycznie obsługuje token w URL i ustawia sesję
const { locals } = Astro;
const { data: { session }, error } = await locals.supabase.auth.getSession();

// If no session or error, token is invalid
const isValidToken = !!session && !error;
---

<Layout title="Ustaw nowe hasło — AI Tutor">
  <main class="min-h-screen flex items-center justify-center bg-background">
    <UpdatePasswordForm client:load isValidToken={isValidToken} />
  </main>
</Layout>
```

---

##### `/auth/logout` - Endpoint wylogowania
```
src/pages/auth/logout.astro
```

**Cel:** Server-side wylogowanie użytkownika i przekierowanie.

**Uwaga:** To nie jest typowa strona do renderowania, ale endpoint realizujący akcję wylogowania.

**Struktura:**
```astro
---
// Server-side only - no render
const { locals } = Astro;

// Sign out user
await locals.supabase.auth.signOut();

// Redirect to login page
return Astro.redirect('/auth/login');
---
```

---

#### 2.1.2. Aktualizacje istniejących stron

##### `/app/profile` - Dodanie ochrony autentykacji
**Lokalizacja:** `src/pages/app/profile.astro`

**Zmiany:**
- Dodanie sprawdzenia sesji na poziomie server-side
- Redirect niezalogowanych użytkowników do `/auth/login?redirect=/app/profile`
- Przekazanie danych użytkownika do komponentu React

**Przed:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
---

<Layout title="Profil — AI Tutor">
  <main>
    <ProfileScreen client:load />
  </main>
</Layout>
```

**Po:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { ProfileScreen } from '@/components/profile/ProfileScreen';

// Check authentication
const { locals, url } = Astro;
const { data: { session } } = await locals.supabase.auth.getSession();

if (!session) {
  const loginUrl = `/auth/login?redirect=${encodeURIComponent(url.pathname)}`;
  return Astro.redirect(loginUrl);
}

// Pass user ID to component as initial prop
const userId = session.user.id;
---

<Layout title="Profil — AI Tutor">
  <main>
    <ProfileScreen client:load userId={userId} />
  </main>
</Layout>
```

---

##### `/app/dashboard` - Nowy dashboard (zakładany)
**Lokalizacja:** `src/pages/app/dashboard.astro` (do utworzenia)

**Cel:** Główny panel aplikacji po zalogowaniu.

**Struktura:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';

// Require authentication
const { locals, url } = Astro;
const { data: { session } } = await locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect(`/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
}
---

<Layout title="Panel główny — AI Tutor">
  <main>
    <DashboardScreen client:load />
  </main>
</Layout>
```

---

##### `/index.astro` - Strona powitalna
**Lokalizacja:** `src/pages/index.astro`

**Zmiany:**
- Dodanie sprawdzenia sesji
- Redirect zalogowanych użytkowników do dashboardu
- Aktualizacja komponentu `Welcome` o linki do logowania/rejestracji

**Przed:**
```astro
---
import Welcome from "../components/Welcome.astro";
import Layout from "../layouts/Layout.astro";
---

<Layout>
  <Welcome />
</Layout>
```

**Po:**
```astro
---
import Welcome from "../components/Welcome.astro";
import Layout from "../layouts/Layout.astro";

// Redirect authenticated users to dashboard
const { locals } = Astro;
const { data: { session } } = await locals.supabase.auth.getSession();

if (session) {
  return Astro.redirect('/app/dashboard');
}
---

<Layout>
  <Welcome />
</Layout>
```

---

### 2.2. Komponenty React Client-side

#### 2.2.1. Struktura katalogów komponentów

```
src/components/
├── auth/                          # Komponenty autentykacji
│   ├── LoginForm.tsx              # Formularz logowania
│   ├── RegisterForm.tsx           # Formularz rejestracji
│   ├── ResetPasswordForm.tsx      # Formularz resetowania hasła
│   ├── UpdatePasswordForm.tsx     # Formularz ustawiania nowego hasła
│   ├── AuthError.tsx              # Wyświetlanie błędów autentykacji
│   ├── AuthSuccessMessage.tsx     # Wyświetlanie komunikatów sukcesu
│   └── README.md                  # Dokumentacja komponentów auth
├── common/                        # Komponenty wspólne (istniejące)
│   ├── ErrorState.tsx
│   └── LoadingState.tsx
└── ui/                            # Shadcn/ui komponenty (istniejące)
    ├── button.tsx
    ├── input.tsx                  # (do dodania)
    ├── form.tsx                   # (do dodania)
    └── ...
```

---

#### 2.2.2. Komponenty formularzy autentykacji

##### `LoginForm.tsx` - Formularz logowania

**Lokalizacja:** `src/components/auth/LoginForm.tsx`

**Odpowiedzialność:**
- Renderowanie formularza logowania (email LUB login + hasło)
- Walidacja client-side danych wejściowych
- Rozwiązanie identyfikatora (login → email) przez endpoint `/api/auth/resolve-identifier`
- Obsługa submit i wywołanie Supabase Auth
- Wyświetlanie błędów walidacji i autentykacji
- Przekierowanie po udanym logowaniu
- Link do rejestracji i resetowania hasła

**Props:**
```typescript
interface LoginFormProps {
  redirectTo?: string; // Domyślnie: '/app/dashboard'
}
```

**Stan komponentu:**
```typescript
interface LoginFormState {
  identifier: string; // Email LUB login
  password: string;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: {
    identifier?: string;
    password?: string;
  };
}
```

**Walidacja:**
- Identifier: Wymagane pole (email lub login)
- Hasło: Min. 6 znaków, wymagane pole

**Przepływ:**
1. Użytkownik wypełnia formularz (identifier może być emailem lub loginem)
2. Client-side walidacja przy onBlur i onChange
3. Submit → `isSubmitting = true`
4. Wywołanie `POST /api/auth/resolve-identifier` z identifier → otrzymanie emaila
5. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
6. Sukces → Przekierowanie do `redirectTo` przez `window.location.href`
7. Błąd → Wyświetlenie komunikatu błędu, `isSubmitting = false`

**Komunikaty błędów:**
- `Invalid login credentials` → "Nieprawidłowy login/email lub hasło"
- `Email not confirmed` → "Email nie został potwierdzony" (tylko dla wersji publicznej, poza MVP)
- `User not found` (z resolver) → "Nie znaleziono użytkownika"
- Network error → "Problem z połączeniem. Spróbuj ponownie."
- Inne → "Wystąpił błąd podczas logowania"

**Obsługa enter key:** Submit formularza

**Struktura UI:**
```
┌─────────────────────────────────────┐
│         Witaj ponownie              │
│  Zaloguj się do swojego konta       │
├─────────────────────────────────────┤
│  [Email lub login]          [icon]  │
│  [Hasło]                    [icon]  │
│  [ ] Zapamiętaj mnie                │
│                                     │
│  [Zaloguj się - pełna szerokość]   │
│                                     │
│  ─────────── lub ───────────        │
│                                     │
│  [Kod dostępu]              [✓/✗]   │
│  [Załóż konto]                      │
│                                     │
│  Zapomniałeś hasła?                 │
└─────────────────────────────────────┘
```

**Przykładowa implementacja (sygnatura):**
```typescript
export function LoginForm({ redirectTo = '/app/dashboard' }: LoginFormProps): JSX.Element {
  const [formState, setFormState] = useState<LoginFormState>({ /* ... */ });
  const supabase = getSupabaseBrowserClient();

  const validateEmail = (email: string): string | undefined => { /* ... */ };
  const validatePassword = (password: string): string | undefined => { /* ... */ };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validation, submission, error handling
  };

  return (
    <Card className="w-full max-w-md">
      {/* Form implementation */}
    </Card>
  );
}
```

---

##### `RegisterForm.tsx` - Formularz rejestracji

**Lokalizacja:** `src/components/auth/RegisterForm.tsx`

**Odpowiedzialność:**
- Renderowanie formularza rejestracji (kod dostępu, login, email, hasło)
- Walidacja kodu dostępu z backendem
- Walidacja wszystkich pól formularza
- Wywołanie rejestracji przez Supabase Auth
- Wyświetlanie komunikatu potwierdzenia po rejestracji

**Props:**
```typescript
interface RegisterFormProps {
  prefilledCode?: string;
}
```

**Stan komponentu:**
```typescript
interface RegisterFormState {
  accessCode: string;
  login: string;
  email: string;
  password: string;
  passwordConfirm: string;
  isSubmitting: boolean;
  isCodeValidating: boolean;
  isCodeValid: boolean | null;
  registrationComplete: boolean;
  error: string | null;
  validationErrors: {
    accessCode?: string;
    login?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  };
}
```

**Walidacja:**
- Kod dostępu: Weryfikacja z backendem (POST `/api/auth/validate-access-code`)
- Login: 3-30 znaków, alfanumeryczne + `_` i `-`, unikalność (sprawdzana przez backend)
- Email: Format email, unikalność (sprawdzana przez backend)
- Hasło: Min. 8 znaków, min. 1 wielka litera, 1 mała, 1 cyfra
- Potwierdzenie hasła: Musi być identyczne z hasłem

**Przepływ (MVP - auto-logowanie):**
1. Użytkownik wprowadza kod dostępu → onBlur walidacja z backendem
2. Jeśli kod poprawny, formularz staje się aktywny
3. Wypełnienie pozostałych pół z client-side walidacją
4. Submit → Wywołanie `POST /api/auth/register` z danymi rejestracji
5. Backend (admin client) weryfikuje kod, tworzy użytkownika z auto-confirm
6. Backend generuje session i zwraca w response
7. **MVP: Frontend otrzymuje session token**
8. **MVP: Frontend ustawia session w Supabase client**
9. **MVP: Użytkownik jest automatycznie zalogowany**
10. Sukces → Redirect do `/app/dashboard`
11. Toast notification: "Witaj w AI Tutor! Twoje konto zostało utworzone."
12. Błąd → Wyświetlenie komunikatu błędu

**Komunikaty błędów:**
- `Invalid access code` → "Kod dostępu jest nieprawidłowy"
- `Access code already used` → "Ten kod dostępu został już wykorzystany"
- `Email already exists` → "Ten email jest już zarejestrowany"
- `Login already exists` → "Ten login jest już zajęty"
- Inne → "Wystąpił błąd podczas rejestracji"

**Komunikat sukcesu (MVP - auto-login):**
```
Witaj w AI Tutor!
Twoje konto zostało utworzone i jesteś zalogowany.

[Przekierowanie do dashboardu...]
```

**Struktura UI:**
```
┌─────────────────────────────────────┐
│      Dołącz do AI Tutor Beta        │
│    Wprowadź kod dostępu              │
├─────────────────────────────────────┤
│  [Kod dostępu]              [✓/✗]   │
│                                     │
│  [Login]                            │
│  [Email]                            │
│  [Hasło]                    [icon]  │
│  [Potwierdź hasło]          [icon]  │
│                                     │
│  [Zarejestruj się]                  │
│                                     │
│  Masz już konto? Zaloguj się        │
└─────────────────────────────────────┘
```

---

##### `ResetPasswordForm.tsx` - Formularz resetowania hasła

**Lokalizacja:** `src/components/auth/ResetPasswordForm.tsx`

**Odpowiedzialność:**
- Renderowanie formularza wprowadzania emaila
- Wywołanie Supabase Auth password reset
- Wyświetlenie komunikatu potwierdzenia wysłania emaila

**Props:**
```typescript
interface ResetPasswordFormProps {
  emailSent?: boolean;
}
```

**Stan komponentu:**
```typescript
interface ResetPasswordFormState {
  email: string;
  isSubmitting: boolean;
  emailSent: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
  };
}
```

**Walidacja:**
- Email: Format email, wymagane pole

**Przepływ:**
1. Użytkownik wprowadza email
2. Submit → `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. Sukces → Wyświetlenie komunikatu o wysłaniu emaila
4. Błąd → Wyświetlenie komunikatu błędu (bez ujawniania czy email istnieje)

**Komunikat sukcesu:**
```
Email wysłany!
Jeśli konto z tym adresem email istnieje, wyślemy link do resetowania hasła.
Sprawdź swoją skrzynkę pocztową (także spam).
```

**Struktura UI:**
```
┌─────────────────────────────────────┐
│      Resetowanie hasła              │
│  Podaj email przypisany do konta    │
├─────────────────────────────────────┤
│  [Email]                            │
│                                     │
│  [Wyślij link resetujący]           │
│                                     │
│  Powrót do logowania                │
└─────────────────────────────────────┘
```

---

##### `UpdatePasswordForm.tsx` - Formularz ustawiania nowego hasła

**Lokalizacja:** `src/components/auth/UpdatePasswordForm.tsx`

**Odpowiedzialność:**
- Renderowanie formularza ustawiania nowego hasła
- Walidacja nowego hasła
- Wywołanie Supabase Auth update password
- Przekierowanie do logowania po sukcesie

**Props:**
```typescript
interface UpdatePasswordFormProps {
  isValidToken: boolean;
}
```

**Stan komponentu:**
```typescript
interface UpdatePasswordFormState {
  password: string;
  passwordConfirm: string;
  isSubmitting: boolean;
  success: boolean;
  error: string | null;
  validationErrors: {
    password?: string;
    passwordConfirm?: string;
  };
}
```

**Walidacja:**
- Hasło: Min. 8 znaków, min. 1 wielka litera, 1 mała, 1 cyfra
- Potwierdzenie hasła: Musi być identyczne

**Przepływ:**
1. Jeśli `isValidToken = false` → Wyświetlenie błędu i linku do ponownego resetu
2. Użytkownik wprowadza nowe hasło
3. Submit → `supabase.auth.updateUser({ password })`
4. Sukces → Wyświetlenie komunikatu i auto-redirect do logowania (3 sekundy)
5. Błąd → Wyświetlenie komunikatu błędu

**Komunikat sukcesu:**
```
Hasło zostało zmienione!
Za chwilę zostaniesz przekierowany do strony logowania...

[Zaloguj się teraz]
```

**Struktura UI (token niepoprawny):**
```
┌─────────────────────────────────────┐
│   Link wygasł lub jest nieprawidłowy│
│                                     │
│  Link do resetowania hasła wygasł   │
│  lub został już użyty.              │
│                                     │
│  [Wyślij nowy link]                 │
└─────────────────────────────────────┘
```

**Struktura UI (token poprawny):**
```
┌─────────────────────────────────────┐
│       Ustaw nowe hasło              │
├─────────────────────────────────────┤
│  [Nowe hasło]               [icon]  │
│  [Potwierdź hasło]          [icon]  │
│                                     │
│  [Zmień hasło]                      │
└─────────────────────────────────────┘
```

---

##### `AuthError.tsx` - Komponent wyświetlania błędów

**Lokalizacja:** `src/components/auth/AuthError.tsx`

**Odpowiedzialność:**
- Wyświetlanie błędów autentykacji w spójny sposób
- Możliwość zamknięcia komunikatu

**Props:**
```typescript
interface AuthErrorProps {
  message: string;
  onDismiss?: () => void;
}
```

**Struktura UI:**
```
┌─────────────────────────────────────┐
│ [!] Komunikat błędu          [X]    │
└─────────────────────────────────────┘
```

---

##### `AuthSuccessMessage.tsx` - Komponent komunikatów sukcesu

**Lokalizacja:** `src/components/auth/AuthSuccessMessage.tsx`

**Odpowiedzialność:**
- Wyświetlanie komunikatów sukcesu w spójny sposób
- Auto-dismiss po określonym czasie (opcjonalnie)

**Props:**
```typescript
interface AuthSuccessMessageProps {
  message: string;
  autoDismiss?: boolean;
  dismissTimeout?: number; // ms
  onDismiss?: () => void;
}
```

---

#### 2.2.3. Komponenty UI (Shadcn/ui - do dodania)

Następujące komponenty Shadcn/ui muszą zostać dodane do projektu:

##### `input.tsx` - Komponent pola tekstowego
**Lokalizacja:** `src/components/ui/input.tsx`

**Funkcjonalność:**
- Pole tekstowe z obsługą różnych typów (text, email, password)
- Obsługa stanów (error, disabled, focus)
- Ikony (leading/trailing)
- Pełna zgodność z ARIA

---

##### `form.tsx` - Komponenty formularza
**Lokalizacja:** `src/components/ui/form.tsx`

**Funkcjonalność:**
- `Form` - wrapper na formularz
- `FormField` - pole formularza z labelką
- `FormMessage` - komunikat błędu walidacji
- `FormDescription` - opis pola

---

##### `alert.tsx` - Komponent alertów
**Lokalizacja:** `src/components/ui/alert.tsx`

**Funkcjonalność:**
- Wyświetlanie alertów (info, success, warning, error)
- Użycie w komponentach `AuthError` i `AuthSuccessMessage`

---

### 2.3. Aktualizacja istniejących komponentów

#### 2.3.1. `ProfileScreen.tsx` - Usunięcie mock data

**Lokalizacja:** `src/components/profile/ProfileScreen.tsx`

**Zmiany:**
- Usunięcie stałej `USE_MOCK_DATA` i logiki mock data
- Akceptacja `userId` jako prop ze strony Astro
- Pełne wykorzystanie hooka `useProfile()` do pobierania danych

**Props (nowe):**
```typescript
interface ProfileScreenProps {
  userId: string;
}
```

---

#### 2.3.2. Layout z nawigacją

**Lokalizacja:** `src/layouts/Layout.astro`

**Potencjalne zmiany:**
- Dodanie nawigacji z linkiem do wylogowania (jeśli sesja aktywna)
- Wyświetlanie username/email w headerze (opcjonalnie)

**Uwaga:** Szczegóły zależą od obecnej struktury Layout.astro

---

### 2.4. Hooki React

#### 2.4.1. `useAuth` - Hook zarządzania sesją

**Lokalizacja:** `src/hooks/useAuth.ts` (nowy plik)

**Odpowiedzialność:**
- Pobieranie aktualnej sesji użytkownika
- Monitorowanie zmian sesji (listener)
- Metody logowania, wylogowania
- Stan ładowania sesji

**Interface:**
```typescript
interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn;
```

**Implementacja (szkic):**
```typescript
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return { user, session, loading, signOut };
}
```

---

### 2.5. Walidacja i komunikaty błędów

#### 2.5.1. Walidatory client-side

**Lokalizacja:** `src/lib/utils/validators.ts` (nowy plik)

**Funkcje walidacyjne:**

```typescript
/**
 * Validates email format
 */
export function validateEmail(email: string): string | undefined {
  if (!email) return 'Email jest wymagany';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Nieprawidłowy format email';
  return undefined;
}

/**
 * Validates login (username)
 * Requirements: 3-30 chars, alphanumeric + _ and -
 */
export function validateLogin(login: string): string | undefined {
  if (!login) return 'Login jest wymagany';
  if (login.length < 3) return 'Login musi mieć minimum 3 znaki';
  if (login.length > 30) return 'Login może mieć maksymalnie 30 znaków';
  const loginRegex = /^[a-zA-Z0-9_-]+$/;
  if (!loginRegex.test(login)) {
    return 'Login może zawierać tylko litery, cyfry, _ oraz -';
  }
  return undefined;
}

/**
 * Validates password strength
 * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
 */
export function validatePassword(password: string): string | undefined {
  if (!password) return 'Hasło jest wymagane';
  if (password.length < 8) return 'Hasło musi mieć minimum 8 znaków';
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  
  if (!hasUppercase) return 'Hasło musi zawierać przynajmniej jedną wielką literę';
  if (!hasLowercase) return 'Hasło musi zawierać przynajmniej jedną małą literę';
  if (!hasDigit) return 'Hasło musi zawierać przynajmniej jedną cyfrę';
  
  return undefined;
}

/**
 * Validates password confirmation
 */
export function validatePasswordConfirm(
  password: string,
  passwordConfirm: string
): string | undefined {
  if (!passwordConfirm) return 'Potwierdzenie hasła jest wymagane';
  if (password !== passwordConfirm) return 'Hasła nie są identyczne';
  return undefined;
}

/**
 * Validates access code format
 */
export function validateAccessCode(code: string): string | undefined {
  if (!code) return 'Kod dostępu jest wymagany';
  // Format depends on implementation - example: 16 chars alphanumeric
  if (code.length !== 16) return 'Kod dostępu musi mieć 16 znaków';
  const codeRegex = /^[A-Z0-9]+$/;
  if (!codeRegex.test(code)) return 'Nieprawidłowy format kodu';
  return undefined;
}
```

---

#### 2.5.2. Mapowanie błędów Supabase na komunikaty PL

**Lokalizacja:** `src/lib/utils/auth-errors.ts` (nowy plik)

**Funkcja mapująca:**

```typescript
/**
 * Maps Supabase auth error to user-friendly Polish message
 */
export function getAuthErrorMessage(error: AuthError | Error): string {
  if ('status' in error && error.status) {
    const status = error.status;
    const message = error.message.toLowerCase();

    // Invalid credentials
    if (status === 400 && message.includes('invalid login credentials')) {
      return 'Nieprawidłowy email lub hasło';
    }

    // Email not confirmed
    if (status === 400 && message.includes('email not confirmed')) {
      return 'Email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.';
    }

    // User already exists
    if (status === 422 && message.includes('already registered')) {
      return 'Ten email jest już zarejestrowany';
    }

    // Weak password
    if (status === 422 && message.includes('password')) {
      return 'Hasło nie spełnia wymagań bezpieczeństwa';
    }
  }

  // Network errors
  if (error.message.toLowerCase().includes('network')) {
    return 'Problem z połączeniem. Sprawdź swoje połączenie internetowe.';
  }

  // Default fallback
  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
}
```

---

### 2.6. Scenariusze użytkownika

#### 2.6.1. Scenariusz: Nowy użytkownik - rejestracja (MVP)

```
1. Użytkownik otrzymuje email z kodem dostępu: ABC123XYZ456PQRS
2. Wchodzi na /auth/login i widzi sekcję "Nie masz konta?"
3. Wprowadza kod dostępu w polu walidacyjnym [onBlur → walidacja z backendem → ✓]
4. Klika CTA "Załóż konto" → przekierowanie do /auth/register?code=ABC123XYZ456PQRS
5. Formularz rejestracji wyświetla się z pre-wypełnionym kodem
6. Użytkownik wprowadza:
   - Kod dostępu: ABC123XYZ456PQRS [już zwalidowany]
   - Login: jan_kowalski [walidacja client-side → ✓]
   - Email: jan@example.com [walidacja client-side → ✓]
   - Hasło: Secure123 [walidacja client-side → ✓]
   - Potwierdź hasło: Secure123 [walidacja → ✓]
7. Klika "Zarejestruj się"
8. Frontend → POST /api/auth/register
9. Backend (admin client):
   - Weryfikuje kod dostępu
   - Sprawdza unikalność login/email
   - Tworzy użytkownika z email_confirm: true (MVP - bez weryfikacji)
   - Generuje session token
10. Frontend otrzymuje session w odpowiedzi
11. Frontend ustawia session w Supabase client
12. **MVP: Użytkownik jest automatycznie zalogowany**
13. Redirect do /app/dashboard
14. Komunikat: "Witaj w AI Tutor! Twoje konto zostało utworzone."
```

**Uwaga MVP:** Email confirmation jest wyłączony w zamkniętej becie dla uproszczenia onboardingu.

---

#### 2.6.2. Scenariusz: Zwykłe logowanie (email lub login)

```
1. Użytkownik wchodzi na /auth/login
2. Wprowadza:
   - Identifier: jan_kowalski (lub jan@example.com)
   - Hasło: Secure123
3. Zaznacza (opcjonalnie) "Zapamiętaj mnie"
4. Klika "Zaloguj się"
5. Frontend → POST /api/auth/resolve-identifier z identifier
6. Backend sprawdza czy to email czy login:
   - Jeśli email → zwraca email
   - Jeśli login → wyszukuje w profiles i zwraca email
7. Frontend otrzymuje email
8. Frontend → supabase.auth.signInWithPassword({ email, password })
9. Sukces → Supabase ustanawia sesję (cookie)
10. Frontend → window.location.href = '/app/dashboard' (lub redirect z param)
11. Server sprawdza sesję w middleware → OK
12. Dashboard renderuje się z danymi użytkownika
```

---

#### 2.6.3. Scenariusz: Zapomniałem hasła

```
1. Użytkownik na /auth/login klika "Zapomniałeś hasła?"
2. Przekierowanie do /auth/reset-password
3. Wprowadza email: jan@example.com
4. Klika "Wyślij link resetujący"
5. Frontend → supabase.auth.resetPasswordForEmail()
6. Wyświetlenie komunikatu: "Email wysłany (jeśli konto istnieje)"
7. Użytkownik otrzymuje email z linkiem
8. Klika link → przekierowanie do /auth/update-password?token=...
9. Server weryfikuje token → jeśli OK, renderuje formularz
10. Użytkownik wprowadza nowe hasło
11. Klika "Zmień hasło"
12. Frontend → supabase.auth.updateUser({ password })
13. Sukces → Komunikat + auto-redirect do /auth/login
14. Użytkownik loguje się nowym hasłem
```

---

#### 2.6.4. Scenariusz: Nieautoryzowany dostęp do chronionej strony

```
1. Użytkownik niezalogowany wchodzi na /app/profile
2. Server sprawdza sesję w getSession() → brak sesji
3. Server → Astro.redirect('/auth/login?redirect=%2Fapp%2Fprofile')
4. Użytkownik widzi stronę logowania
5. Po zalogowaniu → redirect do /app/profile (z query param)
```

---

#### 2.6.5. Scenariusz: Wylogowanie

```
1. Użytkownik zalogowany klika "Wyloguj" w nawigacji
2. Frontend → wywołuje useAuth().signOut() LUB przekierowuje do /auth/logout
3. Supabase → signOut() czyści sesję
4. Redirect do /auth/login
5. Komunikat (opcjonalny): "Zostałeś wylogowany"
```

---

## 3. LOGIKA BACKENDOWA

### 3.1. Struktura endpointów API

#### 3.1.1. Przegląd endpointów autentykacji

```
POST   /api/auth/register              - Rejestracja nowego użytkownika
POST   /api/auth/validate-access-code  - Walidacja kodu dostępu
POST   /api/auth/resolve-identifier    - Rozwiązanie login → email (dla logowania)
POST   /api/auth/resend-confirmation   - Ponowne wysłanie emaila weryfikacyjnego (OPCJONALNE - poza MVP)
```

**Uwaga:** Logowanie, wylogowanie i reset hasła są obsługiwane bezpośrednio przez Supabase Auth w client-side, bez dedykowanych endpointów API.

---

#### 3.1.2. `POST /api/auth/register` - Rejestracja użytkownika

**Lokalizacja:** `src/pages/api/auth/register.ts`

**Odpowiedzialność:**
- Walidacja kodu dostępu (admin client - bypass RLS)
- Walidacja danych wejściowych (login, email, hasło)
- Sprawdzenie unikalności login/email (admin client - bypass RLS)
- Rejestracja użytkownika przez Supabase Auth Admin API
- **MVP:** Auto-aktywacja konta (bez wymaganego email confirmation)
- Oznaczenie kodu dostępu jako wykorzystanego
- **MVP:** Zwrócenie session/access_token dla auto-logowania

**Request:**
```typescript
// Request Body
interface RegisterRequestBody {
  access_code: string;    // Kod dostępu beta
  login: string;          // Username (3-30 chars)
  email: string;          // Email address
  password: string;       // Password (min 8 chars)
}

// Headers
Authorization: Bearer <supabase_service_role_key>  // Opcjonalnie dla admin
```

**Response:**

**Sukces (201 Created) - MVP z auto-logowaniem:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jan@example.com",
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600
  },
  "message": "Konto zostało utworzone. Zostałeś automatycznie zalogowany."
}
```

**Sukces (201 Created) - wersja publiczna z email confirmation (przyszłość):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jan@example.com",
  "confirmation_sent": true,
  "message": "Użytkownik został utworzony. Sprawdź email, aby aktywować konto."
}
```

**Błąd (400 Bad Request):**
```json
{
  "error": {
    "code": "INVALID_ACCESS_CODE",
    "message": "Kod dostępu jest nieprawidłowy lub został już wykorzystany"
  }
}
```

**Błąd (422 Unprocessable Entity):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Błąd walidacji danych",
    "details": {
      "login": "Login jest już zajęty",
      "email": "Email jest już zarejestrowany"
    }
  }
}
```

**Implementacja (szkic):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { accessCodeService } from '@/lib/services/access-code.service';
import { validateLogin, validateEmail, validatePassword } from '@/lib/utils/validators';
import { createSuccessResponse, ErrorResponses } from '@/lib/utils/api-response';
import { createAdminSupabaseClient } from '@/db/supabase.client';

// Zod schema for validation
const RegisterSchema = z.object({
  access_code: z.string().min(1),
  login: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = RegisterSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ErrorResponses.validationError(validationResult.error);
    }

    const { access_code, login, email, password } = validationResult.data;

    // 2. Additional client-side validations
    const loginError = validateLogin(login);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (loginError || emailError || passwordError) {
      return ErrorResponses.validationError({
        login: loginError,
        email: emailError,
        password: passwordError,
      });
    }

    // 3. Use admin client for pre-auth operations (bypass RLS)
    const adminSupabase = createAdminSupabaseClient();

    // 4. Validate access code (admin client)
    const isCodeValid = await accessCodeService.validateCode(
      adminSupabase,
      access_code
    );

    if (!isCodeValid) {
      return ErrorResponses.badRequest(
        'INVALID_ACCESS_CODE',
        'Kod dostępu jest nieprawidłowy lub został już wykorzystany'
      );
    }

    // 5. Check if login or email already exists (admin client - bypass RLS)
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('login, email')
      .or(`login.eq.${login},email.eq.${email}`)
      .single();

    if (existingProfile) {
      const errors: Record<string, string> = {};
      if (existingProfile.login === login) {
        errors.login = 'Login jest już zajęty';
      }
      if (existingProfile.email === email) {
        errors.email = 'Email jest już zarejestrowany';
      }
      return ErrorResponses.validationError(errors);
    }

    // 6. Create user with Supabase Auth Admin API (MVP: auto-confirm email)
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // MVP: Auto-confirm email (skip verification)
      user_metadata: {
        login, // Pass login to metadata for trigger
      },
    });

    if (authError) {
      console.error('Registration error:', authError);
      return ErrorResponses.internalError('Błąd podczas tworzenia konta');
    }

    // 7. Mark access code as used
    await accessCodeService.markCodeAsUsed(
      adminSupabase,
      access_code,
      authData.user!.id
    );

    // 8. MVP: Generate session for auto-login
    const { data: sessionData, error: sessionError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    // For MVP, we can use signInWithPassword directly after creation
    const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      console.warn('Auto-login failed, user will need to log in manually');
      // Still return success, user can log in manually
    }

    // 9. Return success response with session (MVP: auto-login)
    return createSuccessResponse(
      {
        user_id: authData.user!.id,
        email: authData.user!.email,
        session: signInData?.session || null,
        message: 'Konto zostało utworzone. Zostałeś automatycznie zalogowany.',
      },
      201
    );

  } catch (error) {
    console.error('Unexpected registration error:', error);
    return ErrorResponses.internalError();
  }
};
```

---

#### 3.1.3. `POST /api/auth/validate-access-code` - Walidacja kodu

**Lokalizacja:** `src/pages/api/auth/validate-access-code.ts`

**Odpowiedzialność:**
- Sprawdzenie czy kod dostępu jest poprawny i niewykorzystany
- Zwrócenie statusu walidacji

**Request:**
```typescript
// Request Body
interface ValidateAccessCodeRequest {
  access_code: string;
}
```

**Response:**

**Sukces (200 OK):**
```json
{
  "valid": true
}
```

**Błąd (200 OK - nie ujawniamy szczegółów):**
```json
{
  "valid": false
}
```

**Implementacja (szkic):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { accessCodeService } from '@/lib/services/access-code.service';
import { createSuccessResponse, ErrorResponses } from '@/lib/utils/api-response';

const ValidateCodeSchema = z.object({
  access_code: z.string().min(1),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validationResult = ValidateCodeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ErrorResponses.validationError(validationResult.error);
    }

    const { access_code } = validationResult.data;

    const isValid = await accessCodeService.validateCode(
      locals.supabase,
      access_code
    );

    return createSuccessResponse({ valid: isValid });

  } catch (error) {
    console.error('Access code validation error:', error);
    // Don't reveal errors - always return valid: false
    return createSuccessResponse({ valid: false });
  }
};
```

---

#### 3.1.4. `POST /api/auth/resolve-identifier` - Rozwiązanie identyfikatora

**Lokalizacja:** `src/pages/api/auth/resolve-identifier.ts`

**Odpowiedzialność:**
- Rozwiązanie identyfikatora (login lub email) na email potrzebny do Supabase Auth
- Umożliwienie logowania zarówno przez login jak i email

**Request:**
```typescript
// Request Body
interface ResolveIdentifierRequest {
  identifier: string; // Login LUB email
}
```

**Response:**

**Sukces (200 OK):**
```json
{
  "email": "jan@example.com"
}
```

**Błąd (404 Not Found):**
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Nie znaleziono użytkownika"
  }
}
```

**Implementacja (szkic):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSuccessResponse, ErrorResponses } from '@/lib/utils/api-response';
import { createAdminSupabaseClient } from '@/db/supabase.client';

const ResolveSchema = z.object({
  identifier: z.string().min(1),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const validationResult = ResolveSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ErrorResponses.validationError(validationResult.error);
    }

    const { identifier } = validationResult.data;

    // Use admin client to bypass RLS
    const adminSupabase = createAdminSupabaseClient();

    // Check if identifier is email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(identifier);

    if (isEmail) {
      // If it's email, return as-is
      return createSuccessResponse({ email: identifier });
    }

    // Otherwise, look up login in profiles
    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('login', identifier)
      .single();

    if (error || !profile) {
      return ErrorResponses.notFound(
        'USER_NOT_FOUND',
        'Nie znaleziono użytkownika'
      );
    }

    return createSuccessResponse({ email: profile.email });

  } catch (error) {
    console.error('Resolve identifier error:', error);
    return ErrorResponses.internalError();
  }
};
```

---

#### 3.1.5. `POST /api/auth/resend-confirmation` - Ponowne wysłanie emaila (OPCJONALNE - poza MVP)

**Lokalizacja:** `src/pages/api/auth/resend-confirmation.ts`

**Odpowiedzialność:**
- Ponowne wysłanie emaila weryfikacyjnego dla użytkownika, który nie otrzymał lub zgubił pierwotny email

**Request:**
```typescript
// Request Body
interface ResendConfirmationRequest {
  email: string;
}
```

**Response:**

**Sukces (200 OK):**
```json
{
  "message": "Email weryfikacyjny został wysłany (jeśli konto istnieje)"
}
```

**Uwaga:** Nie ujawniamy czy email istnieje w bazie (security)

**Implementacja (szkic):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSuccessResponse, ErrorResponses } from '@/lib/utils/api-response';

const ResendSchema = z.object({
  email: z.string().email(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validationResult = ResendSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ErrorResponses.validationError(validationResult.error);
    }

    const { email } = validationResult.data;

    // Call Supabase to resend
    await locals.supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
      },
    });

    // Always return success (don't reveal if email exists)
    return createSuccessResponse({
      message: 'Email weryfikacyjny został wysłany (jeśli konto istnieje)',
    });

  } catch (error) {
    console.error('Resend confirmation error:', error);
    // Don't reveal errors
    return createSuccessResponse({
      message: 'Email weryfikacyjny został wysłany (jeśli konto istnieje)',
    });
  }
};
```

---

### 3.2. Modele danych

#### 3.2.1. Aktualizacja schematu bazy danych

**Nowa tabela: `access_codes`**

**Lokalizacja:** `supabase/migrations/20251016100000_create_access_codes.sql` (nowa migracja)

**Definicja:**

```sql
-- Access codes for closed beta registration
create table public.access_codes (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    is_used boolean not null default false,
    used_by uuid references public.profiles(id) on delete set null,
    used_at timestamptz,
    created_at timestamptz not null default now(),
    expires_at timestamptz, -- Optional expiration
    
    -- Constraint: code must be uppercase alphanumeric, 16 chars
    constraint access_code_format check (char_length(code) = 16 and code ~ '^[A-Z0-9]+$')
);

-- Index for fast lookup
create index access_codes_code_idx on public.access_codes (code);
create index access_codes_is_used_idx on public.access_codes (is_used);

-- Enable RLS
alter table public.access_codes enable row level security;

-- Policies: read-only for authenticated users (for validation)
create policy access_codes_select_authenticated 
  on public.access_codes 
  for select 
  to authenticated 
  using (true);

-- No direct insert/update/delete for users
create policy access_codes_insert_deny 
  on public.access_codes 
  for insert 
  to authenticated 
  with check (false);

create policy access_codes_update_deny 
  on public.access_codes 
  for update 
  to authenticated 
  using (false);

create policy access_codes_delete_deny 
  on public.access_codes 
  for delete 
  to authenticated 
  using (false);

-- Note: Admin operations will use service role key, bypassing RLS
```

**Uwaga:** Kody dostępu będą generowane i zarządzane przez administratorów (poza MVP).

---

#### 3.2.2. Aktualizacja typu `Database`

**Lokalizacja:** `src/db/database.types.ts`

Po utworzeniu migracji, należy zaktualizować typy przez:
```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

Nowy typ `access_codes` zostanie automatycznie dodany.

---

#### 3.2.3. DTO dla autentykacji

**Lokalizacja:** `src/types.ts`

**Nowe DTOs:**

```typescript
// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Register User Command
 * Request body for POST /api/auth/register
 */
export interface RegisterUserCommand {
  access_code: string;
  login: string;
  email: string;
  password: string;
}

/**
 * Register User Response (MVP - with session)
 * Response from POST /api/auth/register
 */
export interface RegisterUserResponseDTO {
  user_id: string;
  email: string;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } | null;
  message: string;
}

/**
 * Validate Access Code Command
 * Request body for POST /api/auth/validate-access-code
 */
export interface ValidateAccessCodeCommand {
  access_code: string;
}

/**
 * Validate Access Code Response
 */
export interface ValidateAccessCodeResponseDTO {
  valid: boolean;
}

/**
 * Resolve Identifier Command
 * Request body for POST /api/auth/resolve-identifier
 */
export interface ResolveIdentifierCommand {
  identifier: string; // Login or email
}

/**
 * Resolve Identifier Response
 */
export interface ResolveIdentifierResponseDTO {
  email: string;
}

/**
 * Resend Confirmation Command (OPCJONALNE - poza MVP)
 * Request body for POST /api/auth/resend-confirmation
 */
export interface ResendConfirmationCommand {
  email: string;
}

/**
 * Resend Confirmation Response
 */
export interface ResendConfirmationResponseDTO {
  message: string;
}
```

---

### 3.3. Serwisy backendowe

#### 3.3.1. `access-code.service.ts` - Zarządzanie kodami dostępu

**Lokalizacja:** `src/lib/services/access-code.service.ts` (nowy plik)

**Odpowiedzialność:**
- Walidacja kodu dostępu
- Oznaczanie kodu jako wykorzystanego
- Generowanie kodów (dla admina - future)

**Interface:**

```typescript
export interface AccessCodeService {
  /**
   * Validates if access code is valid and unused
   */
  validateCode(supabase: SupabaseClient, code: string): Promise<boolean>;
  
  /**
   * Marks access code as used by a user
   */
  markCodeAsUsed(
    supabase: SupabaseClient,
    code: string,
    userId: string
  ): Promise<void>;
  
  /**
   * Generates a new access code (admin only)
   */
  generateCode(supabase: SupabaseClient): Promise<string>;
}
```

**Implementacja (szkic):**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

class AccessCodeServiceImpl implements AccessCodeService {
  async validateCode(
    supabase: SupabaseClient<Database>,
    code: string
  ): Promise<boolean> {
    try {
      // Query for code
      const { data, error } = await supabase
        .from('access_codes')
        .select('id, is_used, expires_at')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        return false;
      }

      // Check if used
      if (data.is_used) {
        return false;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating access code:', error);
      return false;
    }
  }

  async markCodeAsUsed(
    supabase: SupabaseClient<Database>,
    code: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('access_codes')
        .update({
          is_used: true,
          used_by: userId,
          used_at: new Date().toISOString(),
        })
        .eq('code', code.toUpperCase());

      if (error) {
        console.error('Error marking code as used:', error);
        throw new Error('Failed to mark access code as used');
      }
    } catch (error) {
      console.error('Error in markCodeAsUsed:', error);
      throw error;
    }
  }

  async generateCode(supabase: SupabaseClient<Database>): Promise<string> {
    // Generate random 16-char alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Insert into database
    const { error } = await supabase
      .from('access_codes')
      .insert({ code });

    if (error) {
      throw new Error('Failed to generate access code');
    }

    return code;
  }
}

export const accessCodeService = new AccessCodeServiceImpl();
```

---

#### 3.3.2. Aktualizacja `profile.service.ts`

**Lokalizacja:** `src/lib/services/profile.service.ts`

**Potencjalne aktualizacje:**
- Metoda do sprawdzania unikalności loginu
- Metoda do sprawdzania unikalności emaila

**Nowe metody:**

```typescript
/**
 * Checks if login is available
 */
async isLoginAvailable(
  supabase: SupabaseClient<Database>,
  login: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('login', login)
    .single();

  // Login is available if no record found
  return !data && error?.code === 'PGRST116';
}

/**
 * Checks if email is available
 */
async isEmailAvailable(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  return !data && error?.code === 'PGRST116';
}
```

---

### 3.4. Middleware i ochrona zasobów

#### 3.4.1. Aktualizacja middleware Astro

**Lokalizacja:** `src/middleware/index.ts`

**Aktualna funkcjonalność:**
- Inicjalizacja Supabase client w `context.locals`

**Nowa funkcjonalność:**
- Sprawdzanie sesji użytkownika
- Przekierowanie niezalogowanych użytkowników z `/app/*` do logowania
- Przekierowanie zalogowanych użytkowników z `/auth/*` do dashboardu
- Dodanie `context.locals.session` i `context.locals.user`

**Implementacja (szkic):**

```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Initialize Supabase client in context
  context.locals.supabase = supabaseClient;

  // 2. Get session from Supabase
  const { data: { session }, error } = await supabaseClient.auth.getSession();

  // 3. Add session and user to context
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  // 4. Define protected and public routes
  const pathname = context.url.pathname;
  const isProtectedRoute = pathname.startsWith('/app/');
  const isAuthRoute = pathname.startsWith('/auth/');

  // 5. Redirect logic
  if (isProtectedRoute && !session) {
    // Protected route accessed by unauthenticated user
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
    return context.redirect(redirectUrl);
  }

  // Exception routes that require session but should not redirect
  const authExceptions = ['/auth/logout', '/auth/update-password'];
  const isAuthException = authExceptions.some(route => pathname.startsWith(route));

  if (isAuthRoute && session && !isAuthException) {
    // Auth route accessed by authenticated user (except logout & update-password)
    return context.redirect('/app/dashboard');
  }

  // 6. Continue to next middleware or route
  return next();
});
```

**Uwaga:** To jest globalne middleware, ale poszczególne strony mogą nadal implementować własne sprawdzenia sesji dla bardziej szczegółowej kontroli.

---

#### 3.4.2. Aktualizacja typów `App.Locals`

**Lokalizacja:** `src/env.d.ts`

**Aktualizacja:**

```typescript
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      session: Session | null;
      user: User | null;
    }
  }
}
```

---

### 3.5. Obsługa wyjątków i logowanie

#### 3.5.1. Rozszerzenie `api-response.ts`

**Lokalizacja:** `src/lib/utils/api-response.ts`

**Nowe funkcje pomocnicze:**

```typescript
/**
 * Error response for validation errors with detailed field messages
 */
export function validationError(
  details: Record<string, string> | z.ZodError
): Response {
  let errorDetails: Record<string, string>;

  if (details instanceof z.ZodError) {
    // Convert Zod error to field messages
    errorDetails = {};
    details.errors.forEach((err) => {
      const field = err.path.join('.');
      errorDetails[field] = err.message;
    });
  } else {
    errorDetails = details;
  }

  return new Response(
    JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Błąd walidacji danych',
        details: errorDetails,
      },
    }),
    {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Error response for bad request (generic)
 */
export function badRequest(code: string, message: string): Response {
  return new Response(
    JSON.stringify({
      error: { code, message },
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

---

#### 3.5.2. Logowanie zdarzeń autentykacji

**Strategia logowania:**

- **Sukces logowania:** `console.info` z `userId`, `timestamp`
- **Niepowodzenie logowania:** `console.warn` z `email` (nie hasło!), `reason`
- **Rejestracja:** `console.info` z `userId`, `email`
- **Reset hasła:** `console.info` z `email`
- **Błędy walidacji kodu:** `console.warn` z `code` (first 4 chars), `reason`

**Przykład:**
```typescript
console.info('[AUTH] User logged in', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});

console.warn('[AUTH] Login failed', {
  email: email,
  reason: 'Invalid credentials',
  timestamp: new Date().toISOString(),
});
```

---

## 4. SYSTEM AUTENTYKACJI

### 4.1. Integracja z Supabase Auth

#### 4.1.1. Przepływ autentykacji

**Diagram przepływu:**

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │         │ Astro Server │         │   Supabase   │
└──────┬──────┘         └──────┬───────┘         └──────┬───────┘
       │                       │                        │
       │  POST /api/auth/      │                        │
       │  register             │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │  Validate access code  │
       │                       │  (query DB)            │
       │                       ├───────────────────────>│
       │                       │<───────────────────────┤
       │                       │  Code valid            │
       │                       │                        │
       │                       │  signUp()              │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │                        │ Create auth.users
       │                       │                        │ Trigger: create profiles
       │                       │                        │ Send confirmation email
       │                       │<───────────────────────┤
       │                       │  User created          │
       │                       │                        │
       │                       │  Mark code as used     │
       │                       ├───────────────────────>│
       │                       │<───────────────────────┤
       │                       │                        │
       │<──────────────────────┤                        │
       │  201 Created          │                        │
       │                       │                        │
       │                       │                        │
       │ User clicks email link│                        │
       ├───────────────────────┼───────────────────────>│
       │                       │                        │ Confirm email
       │                       │                        │ Activate account
       │<──────────────────────┼────────────────────────┤
       │ Redirect to /auth/login                        │
       │                       │                        │
```

---

#### 4.1.2. Konfiguracja Supabase Auth

**Lokalizacja:** Supabase Dashboard → Authentication → Settings

**Wymagane ustawienia:**

1. **Email Confirmations (MVP vs Produkcja):**
   - **MVP (zamknięta beta):** 
     - Enable email confirmations: `false` (auto-confirm przez admin API)
     - Użytkownicy są tworzeni przez `admin.createUser()` z `email_confirm: true`
   - **Wersja publiczna (przyszłość):**
     - Enable email confirmations: `true`
     - Confirmation URL: `https://yourdomain.com/auth/login`

2. **Password Requirements:**
   - Minimum password length: `8`
   - Require uppercase: `true`
   - Require lowercase: `true`
   - Require numbers: `true`
   - Require special characters: `false` (opcjonalnie)

3. **Email Templates:**
   - Customize confirmation email template (PL language)
   - Customize password reset email template (PL language)

4. **Redirect URLs:**
   - Allowed redirect URLs:
     - `http://localhost:3000/auth/login`
     - `http://localhost:3000/auth/update-password`
     - `https://yourdomain.com/auth/login`
     - `https://yourdomain.com/auth/update-password`

5. **JWT Settings:**
   - JWT expiry: `3600` seconds (1 hour)
   - Refresh token rotation: `enabled`

---

#### 4.1.3. Template emaili (przykłady)

##### Email weryfikacyjny

**Subject:** Potwierdź swój email - AI Tutor

**Body:**
```html
<h2>Witaj w AI Tutor!</h2>

<p>Dziękujemy za rejestrację w wersji beta AI Tutor.</p>

<p>Aby aktywować swoje konto, kliknij poniższy link:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="...">
    Aktywuj konto
  </a>
</p>

<p>Link jest ważny przez 24 godziny.</p>

<p>Jeśli nie rejestrowałeś się w AI Tutor, zignoruj ten email.</p>

<p>Pozdrawiamy,<br>Zespół AI Tutor</p>
```

---

##### Email resetowania hasła

**Subject:** Resetowanie hasła - AI Tutor

**Body:**
```html
<h2>Resetowanie hasła</h2>

<p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta AI Tutor.</p>

<p>Aby ustawić nowe hasło, kliknij poniższy link:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="...">
    Zresetuj hasło
  </a>
</p>

<p>Link jest ważny przez 1 godzinę.</p>

<p>Jeśli nie prosiłeś o reset hasła, zignoruj ten email - Twoje hasło pozostanie bez zmian.</p>

<p>Pozdrawiamy,<br>Zespół AI Tutor</p>
```

---

### 4.2. Zarządzanie sesjami

#### 4.2.1. Przechowywanie sesji

**Mechanizm:** Supabase Auth automatycznie zarządza sesjami przez HTTP-only cookies.

**Cookie name:** `sb-<project-ref>-auth-token`

**Właściwości:**
- `HttpOnly: true` - niedostępne dla JavaScript (bezpieczeństwo)
- `Secure: true` - tylko HTTPS (w produkcji)
- `SameSite: Lax` - ochrona przed CSRF

**Czas życia:**
- Access token: 1 godzina
- Refresh token: 7 dni (domyślnie)

---

#### 4.2.2. Odświeżanie sesji

Supabase Auth automatycznie odświeża sesję w tle przez `supabase.auth.onAuthStateChange()`.

**Client-side (React):**
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed');
      }
      // Update local state
      setSession(session);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**Server-side (Astro middleware):**
```typescript
// Middleware automatically gets fresh session on each request
const { data: { session } } = await supabase.auth.getSession();
```

---

#### 4.2.3. Wylogowanie

**Client-side:**
```typescript
await supabase.auth.signOut();
// Session cleared, cookies removed
window.location.href = '/auth/login';
```

**Server-side (route handler):**
```typescript
// In /auth/logout.astro
await locals.supabase.auth.signOut();
return Astro.redirect('/auth/login');
```

---

### 4.3. Bezpieczeństwo

#### 4.3.1. Ochrona przed atakami

**CSRF (Cross-Site Request Forgery):**
- Supabase Auth cookies z `SameSite: Lax`
- API endpoints wymagają JWT w header (nie cookie)

**XSS (Cross-Site Scripting):**
- React automatycznie escapuje dane wejściowe
- Użycie `dangerouslySetInnerHTML` jest zabronione
- Content Security Policy (CSP) headers (do dodania w produkcji)

**SQL Injection:**
- Supabase używa prepared statements
- RLS (Row Level Security) jako dodatkowa warstwa ochrony

**Brute Force:**
- Rate limiting przez Supabase Auth (wbudowane)
- Limit: 5 failed attempts w 1 godzinę → tymczasowy ban
- CAPTCHA (opcjonalnie - do rozważenia w przyszłości)

**Słabe hasła:**
- Wymuszenie silnych haseł (min 8 chars, uppercase, lowercase, digit)
- Walidacja client-side i server-side

---

#### 4.3.2. RLS (Row Level Security) policies

**Tabela `profiles`:**
```sql
-- User can only read/update their own profile
create policy profiles_select_authenticated 
  on public.profiles 
  for select 
  to authenticated 
  using (auth.uid() = id);

create policy profiles_update_authenticated 
  on public.profiles 
  for update 
  to authenticated 
  using (auth.uid() = id) 
  with check (auth.uid() = id);
```

**Tabela `access_codes`:**
```sql
-- Users can only read (for validation), not modify
create policy access_codes_select_authenticated 
  on public.access_codes 
  for select 
  to authenticated 
  using (true);

-- No insert/update/delete for users
-- Admin operations use service role key
```

---

#### 4.3.3. Zmienne środowiskowe

**Lokalizacja:** `.env` (nie commitowane do repo)

**Wymagane zmienne:**

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin operations (NEVER expose to client!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
PUBLIC_APP_URL=http://localhost:3000
```

**Uwaga:** `SUPABASE_SERVICE_ROLE_KEY` ma pełny dostęp, używać tylko server-side!

---

## 5. PLAN IMPLEMENTACJI

### 5.1. Fazy wdrożenia

#### Faza 1: Infrastruktura (1-2 dni)
- [ ] Utworzenie migracji `access_codes` table
- [ ] Wygenerowanie nowych typów TypeScript
- [ ] Aktualizacja `env.d.ts` z nowymi polami w `Locals`
- [ ] Konfiguracja Supabase Auth w dashboard
- [ ] Dostosowanie email templates

#### Faza 2: Backend API (2-3 dni)
- [ ] Implementacja `createAdminSupabaseClient()` w `supabase.client.ts`
- [ ] Implementacja `access-code.service.ts`
- [ ] Implementacja `POST /api/auth/validate-access-code`
- [ ] Implementacja `POST /api/auth/resolve-identifier` (login → email)
- [ ] Implementacja `POST /api/auth/register` (MVP: admin client, auto-confirm, session return)
- [ ] Aktualizacja `api-response.ts` (dodanie `notFound()`)
- [ ] ~~Implementacja `POST /api/auth/resend-confirmation`~~ (OPCJONALNE - poza MVP)
- [ ] Testy manualne endpoints

#### Faza 3: Middleware i ochrona (1 dzień)
- [ ] Aktualizacja middleware z logiką autentykacji
- [ ] Aktualizacja istniejących stron `/app/*` z ochroną
- [ ] Utworzenie `/app/dashboard.astro`

#### Faza 4: Komponenty UI (3-4 dni)
- [ ] Dodanie komponentów Shadcn/ui: `input`, `form`, `alert`
- [ ] Implementacja `LoginForm.tsx` (identifier + kod dostępu gate, integracja z resolve-identifier)
- [ ] Implementacja `RegisterForm.tsx` (MVP: obsługa session z response, auto-login)
- [ ] Implementacja `ResetPasswordForm.tsx`
- [ ] Implementacja `UpdatePasswordForm.tsx`
- [ ] Implementacja `AuthError.tsx` i `AuthSuccessMessage.tsx`

#### Faza 5: Strony Astro (1-2 dni)
- [ ] Utworzenie `/auth/login.astro`
- [ ] Utworzenie `/auth/register.astro`
- [ ] Utworzenie `/auth/reset-password.astro`
- [ ] Utworzenie `/auth/update-password.astro`
- [ ] Utworzenie `/auth/logout.astro`
- [ ] Aktualizacja `/index.astro`

#### Faza 6: Hooki i walidatory (1 dzień)
- [ ] Implementacja `useAuth.ts`
- [ ] Implementacja `validators.ts`
- [ ] Implementacja `auth-errors.ts`

#### Faza 7: Aktualizacja profilu (1 dzień)
- [ ] Aktualizacja `/app/profile.astro` z ochroną
- [ ] Usunięcie mock data z `ProfileScreen.tsx`
- [ ] Aktualizacja `useProfile` hook

#### Faza 8: Testy i poprawki (2-3 dni)
- [ ] Testy end-to-end przepływów użytkownika
- [ ] Testy walidacji
- [ ] Testy błędów i edge cases
- [ ] Poprawki błędów
- [ ] Testy responsywności UI

#### Faza 9: Dokumentacja (1 dzień)
- [ ] Utworzenie `README.md` w `src/components/auth/`
- [ ] Dokumentacja API endpoints w `src/pages/api/README.md`
- [ ] Aktualizacja głównego `README.md` projektu

**Szacowany czas całkowity:** 12-18 dni roboczych

---

### 5.2. Kryteria akceptacji

#### US-001: Rejestracja i pierwszy dostęp do bety

✅ **Spełnione gdy:**
1. System prezentuje stronę rejestracji z polem na kod dostępu
2. Po wpisaniu prawidłowego kodu, formularz staje się aktywny
3. Po wpisaniu nieprawidłowego kodu, wyświetlany jest komunikat błędu
4. Po pomyślnej rejestracji, użytkownik otrzymuje email weryfikacyjny
5. Po weryfikacji, użytkownik może się zalogować

#### US-002: Logowanie do aplikacji

✅ **Spełnione gdy:**
1. Strona główna/logowania zawiera formularz logowania (email + hasło)
2. Po podaniu prawidłowych danych, użytkownik jest zalogowany i przekierowany do dashboardu
3. Po podaniu nieprawidłowych danych, wyświetlany jest komunikat błędu
4. System oferuje opcję "zapomniałem hasła"
5. Link prowadzi do formularza resetowania hasła
6. Email z linkiem resetującym jest wysyłany
7. Po kliknięciu linku, użytkownik może ustawić nowe hasło

---

### 5.3. Testy do wykonania

#### Testy funkcjonalne

1. **Rejestracja:**
   - Rejestracja z poprawnym kodem
   - Rejestracja z niepoprawnym kodem
   - Rejestracja z wykorzystanym kodem
   - Rejestracja z zajętym loginem
   - Rejestracja z zajętym emailem
   - Walidacja siły hasła

2. **Logowanie:**
   - Logowanie z poprawnymi danymi
   - Logowanie z błędnym hasłem
   - Logowanie z niezweryfikowanym emailem
   - Logowanie użytkownika już zalogowanego (redirect)

3. **Reset hasła:**
   - Żądanie resetu dla istniejącego emaila
   - Żądanie resetu dla nieistniejącego emaila (nie ujawniamy)
   - Kliknięcie w link z emaila
   - Ustawienie nowego hasła
   - Używanie wygasłego linku

4. **Ochrona zasobów:**
   - Dostęp do `/app/profile` bez logowania (redirect)
   - Dostęp do `/app/dashboard` bez logowania (redirect)
   - Dostęp do `/auth/login` będąc zalogowanym (redirect)
   - Poprawny redirect po zalogowaniu do pierwotnej strony

5. **Wylogowanie:**
   - Kliknięcie "Wyloguj"
   - Sprawdzenie braku dostępu do chronionych zasobów

#### Testy bezpieczeństwa

1. SQL Injection w formularzach
2. XSS przez wprowadzanie skryptów w polach
3. CSRF przez próby wywołania endpoints z innej domeny
4. Brute force logowania (sprawdzenie rate limiting)
5. Próba użycia wygasłych/niepoprawnych JWT tokens

---

## 6. PODSUMOWANIE

### 6.1. Kluczowe decyzje architektoniczne

1. **Autentykacja przez Supabase Auth:**
   - Wykorzystanie wbudowanych mechanizmów Supabase dla logowania, rejestracji, reset hasła
   - JWT tokens w HTTP-only cookies
   - Automatic session refresh

2. **Kody dostępu w bazie danych:**
   - Osobna tabela `access_codes` z RLS
   - Walidacja server-side przed rejestracją
   - Oznaczanie jako użyte po rejestracji

3. **Middleware jako główna ochrona:**
   - Globalne middleware w Astro dla redirectów
   - Dodatkowe sprawdzenia na stronach dla szczegółowej kontroli

4. **React tylko dla interaktywności:**
   - Formularze jako komponenty React (client:load)
   - Strony Astro dla SSR i SEO
   - Jasny podział odpowiedzialności

5. **Walidacja na obu poziomach:**
   - Client-side: natychmiastowy feedback UX
   - Server-side: bezpieczeństwo i spójność danych

---

### 6.2. Punkty integracji z istniejącym systemem

1. **Tabela `profiles`:**
   - Już istnieje z triggerem `handle_new_user()`
   - Wymaga tylko aktualizacji middleware do przekazywania `userId`

2. **API endpoints:**
   - Wzorzec z `/api/profile` jest zachowany
   - Nowe endpoints w `/api/auth/*` zgodne ze stylem

3. **Komponenty UI:**
   - Używają istniejących komponentów z Shadcn/ui
   - Dodanie brakujących: `input`, `form`, `alert`

4. **Typy i DTOs:**
   - Rozszerzenie `src/types.ts` o DTOs autentykacji
   - Zachowanie spójności z istniejącymi typami

---

### 6.3. Ryzyka i mitigation

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitigation |
|--------|-------------------|-------|-----------|
| Problemy z konfiguracją Supabase Auth | Niskie | Wysoki | Dokładne śledzenie dokumentacji Supabase, testy w środowisku dev |
| Trudności z middleware redirects | Średnie | Średni | Testy różnych scenariuszy, fallback logic w stronach |
| Błędy w walidacji kodów dostępu | Niskie | Średni | Unit testy dla `access-code.service`, manualne testy z różnymi kodami |
| UX issues w formularzach | Średnie | Niski | User testing podczas fazy 8, iteracje na podstawie feedbacku |
| Email delivery issues | Niskie | Wysoki | Konfiguracja SMTP w Supabase, testy wysyłki, monitoring |

---

### 6.4. Metryki sukcesu implementacji

1. **Funkcjonalność:**
   - ✅ Wszystkie user stories US-001 i US-002 spełnione
   - ✅ Zero critical bugs w testach

2. **Bezpieczeństwo:**
   - ✅ Wszystkie testy bezpieczeństwa passed
   - ✅ RLS policies działają poprawnie

3. **UX:**
   - ✅ Formularz submission time < 2s
   - ✅ Walidacja feedback < 300ms
   - ✅ Responsywność na mobile i desktop

4. **Kod:**
   - ✅ Zero linter errors
   - ✅ TypeScript strict mode bez błędów
   - ✅ Wszystkie pliki udokumentowane

---

## 7. ZAŁĄCZNIKI

### 7.1. Przykładowe komendy

**Utworzenie nowej migracji:**
```bash
npx supabase migration new create_access_codes
```

**Zastosowanie migracji lokalnie:**
```bash
npx supabase db push
```

**Wygenerowanie typów TypeScript:**
```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

**Dodanie komponentu Shadcn/ui:**
```bash
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add alert
```

---

### 7.2. Użyteczne linki

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Astro Middleware Guide](https://docs.astro.build/en/guides/middleware/)
- [React 19 Documentation](https://react.dev/)
- [Shadcn/ui Components](https://ui.shadcn.com/)

---

### 7.3. Kontakt i wsparcie

**Dla pytań technicznych:**
- Dokumentacja Supabase: https://supabase.com/docs
- Astro Discord: https://astro.build/chat

**Dla code review:**
- PR template zgodny z projektem
- Minimum 1 reviewer przed merge do main

---

---

## 8. CHANGELOG - AKTUALIZACJE PO AUDYCIE PRD

**Data aktualizacji:** 2025-10-16  
**Powód:** Harmonizacja specyfikacji technicznej z wymaganiami PRD i dostosowanie do MVP

### 8.1. Kluczowe zmiany wprowadzone

#### 8.1.1. Logowanie przez email LUB login
- **Zmiana:** `LoginForm` przyjmuje teraz "identifier" zamiast tylko email
- **Nowy endpoint:** `POST /api/auth/resolve-identifier` konwertuje login → email
- **Uzasadnienie:** PRD US-002 sugeruje możliwość logowania przez login, nie tylko email

#### 8.1.2. Pre-gate z kodem dostępu na stronie logowania
- **Zmiana:** Strona `/auth/login` zawiera dodatkowe pole „Kod dostępu" z walidacją
- **CTA:** „Załóż konto" przekierowuje do `/auth/register?code=...` po walidacji
- **Uzasadnienie:** PRD US-001 sugeruje prezentację kodu dostępu już na stronie logowania

#### 8.1.3. Auto-logowanie po rejestracji (MVP)
- **Zmiana:** Endpoint `/api/auth/register` zwraca `session` w response
- **Flow:** Frontend automatycznie ustawia session i przekierowuje do dashboard
- **Wyłączenie:** Email confirmation disabled w MVP (auto-confirm przez admin API)
- **Uzasadnienie:** Uproszczenie onboardingu w zamkniętej becie

#### 8.1.4. Admin Supabase client w pre-auth operations
- **Zmiana:** Endpointy `/api/auth/register`, `/api/auth/validate-access-code`, `/api/auth/resolve-identifier` używają admin clienta
- **Powód:** Bypass RLS dla operacji przed autentykacją (sprawdzanie unikalności, walidacja kodu)
- **Security:** Service role key tylko server-side, nigdy w kliencie

#### 8.1.5. Middleware - wyjątki dla auth routes
- **Zmiana:** Dodano wyjątki dla `/auth/logout` i `/auth/update-password`
- **Powód:** `/auth/update-password` wymaga sesji z tokenu resetowania, nie powinien redirectować zalogowanych

#### 8.1.6. Resend-confirmation jako opcjonalny
- **Zmiana:** Endpoint oznaczony jako OPCJONALNY - poza MVP
- **Powód:** Nie wymieniony w PRD US-001/US-002, niepotrzebny przy auto-confirm w MVP

### 8.2. Nowe DTOs i typy

```typescript
// Nowe interfejsy
ResolveIdentifierCommand
ResolveIdentifierResponseDTO

// Zaktualizowane interfejsy
RegisterUserResponseDTO // Dodano pole session
LoginFormState // email → identifier
```

### 8.3. Implikacje dla implementacji

1. **Priorytet:** Implementacja `createAdminSupabaseClient()` przed endpointami
2. **Testowanie:** Specjalne testy dla auto-logowania po rejestracji
3. **Konfiguracja:** Supabase Auth z email confirmation DISABLED w dev/beta
4. **Przyszłość:** Łatwa migracja do email confirmation w wersji publicznej

---

**Koniec specyfikacji**

*Wersja: 1.1 (zaktualizowano po audycie PRD)*  
*Data: 2025-10-16*  
*Autor: AI Assistant*

