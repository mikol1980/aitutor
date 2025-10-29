# Komponenty Autentykacji

Ten folder zawiera wszystkie komponenty React związane z procesem autentykacji użytkowników.

## Struktura

```
auth/
├── LoginForm.tsx              # Formularz logowania
├── RegisterForm.tsx           # Formularz rejestracji
├── ResetPasswordForm.tsx      # Formularz resetowania hasła
├── UpdatePasswordForm.tsx     # Formularz ustawiania nowego hasła
├── AuthError.tsx              # Komponent wyświetlania błędów
├── AuthSuccessMessage.tsx     # Komponent komunikatów sukcesu
└── README.md                  # Ta dokumentacja
```

## Komponenty

### LoginForm

Formularz logowania z obsługą:
- Logowania przez email LUB login (identyfikator)
- Walidacji client-side
- Pre-gate kodu dostępu dla nowych użytkowników
- Przekierowania po udanym logowaniu

**Props:**
- `redirectTo?: string` - URL przekierowania po zalogowaniu (domyślnie: `/app/dashboard`)

**Użycie:**
```tsx
<LoginForm client:load redirectTo="/app/profile" />
```

### RegisterForm

Formularz rejestracji z obsługą:
- Walidacji kodu dostępu
- Walidacji wszystkich pól formularza
- Auto-logowania po rejestracji (MVP)
- Pre-wypełniania kodu z URL

**Props:**
- `prefilledCode?: string` - Kod dostępu do pre-wypełnienia

**Użycie:**
```tsx
<RegisterForm client:load prefilledCode="ABC123XYZ456PQRS" />
```

### ResetPasswordForm

Formularz żądania resetu hasła z obsługą:
- Walidacji emaila
- Wyświetlania komunikatu po wysłaniu
- Bezpiecznego feedback (nie ujawnia czy email istnieje)

**Props:**
- `emailSent?: boolean` - Czy email został już wysłany

**Użycie:**
```tsx
<ResetPasswordForm client:load emailSent={false} />
```

### UpdatePasswordForm

Formularz ustawiania nowego hasła z obsługą:
- Walidacji siły hasła
- Weryfikacji tokenu resetowania
- Auto-przekierowania po sukcesie

**Props:**
- `isValidToken: boolean` - Czy token resetowania jest poprawny

**Użycie:**
```tsx
<UpdatePasswordForm client:load isValidToken={true} />
```

### AuthError

Komponent do spójnego wyświetlania błędów autentykacji.

**Props:**
- `message: string` - Komunikat błędu do wyświetlenia
- `onDismiss?: () => void` - Callback po zamknięciu alertu

**Użycie:**
```tsx
<AuthError
  message="Nieprawidłowy email lub hasło"
  onDismiss={() => setError(null)}
/>
```

### AuthSuccessMessage

Komponent do spójnego wyświetlania komunikatów sukcesu.

**Props:**
- `message: string` - Komunikat sukcesu
- `autoDismiss?: boolean` - Czy automatycznie ukryć po czasie
- `dismissTimeout?: number` - Czas w ms do auto-ukrycia (domyślnie: 5000)
- `onDismiss?: () => void` - Callback po zamknięciu

**Użycie:**
```tsx
<AuthSuccessMessage
  message="Email został wysłany"
  autoDismiss={true}
  dismissTimeout={5000}
/>
```

## Walidacja

Wszystkie formularze implementują walidację client-side:

### Email
- Wymagane pole
- Poprawny format email

### Login
- 3-30 znaków
- Tylko alfanumeryczne + `_` i `-`

### Hasło
- Minimum 8 znaków
- Przynajmniej 1 wielka litera
- Przynajmniej 1 mała litera
- Przynajmniej 1 cyfra

### Kod dostępu
- 16 znaków
- Wielkie litery i cyfry
- Walidacja z backendem

## Integracja z backendem

**UWAGA:** Aktualnie komponenty zawierają mock implementacje integracji z backendem.

Aby podłączyć prawdziwy backend, należy odkomentować sekcje z TODO w następujących miejscach:

### LoginForm
```typescript
// TODO: Implement authentication when backend is ready
// 1. Resolve identifier to email via POST /api/auth/resolve-identifier
// 2. Sign in with Supabase via supabase.auth.signInWithPassword()
```

### RegisterForm
```typescript
// TODO: Implement registration when backend is ready
// POST /api/auth/register with all data
// Receive session in response (MVP: auto-login)
```

### ResetPasswordForm
```typescript
// TODO: Implement password reset when backend is ready
// await supabase.auth.resetPasswordForEmail()
```

### UpdatePasswordForm
```typescript
// TODO: Implement password update when backend is ready
// await supabase.auth.updateUser({ password })
```

## Stylizacja

Komponenty używają:
- **Shadcn/ui** - komponenty bazowe (Card, Button, Input, Label, Alert)
- **Tailwind CSS** - stylowanie
- **class-variance-authority** - warianty komponentów

Wszystkie komponenty są responsywne i zgodne z istniejącym design system projektu.

## Dostępność (a11y)

- Wszystkie pola formularza mają odpowiednie `<Label>`
- Komunikaty błędów są powiązane z polami
- Przyciski mają aria-label gdzie potrzeba
- Fokus jest odpowiednio zarządzany

## Następne kroki

1. **Implementacja backendu** - endpointy API zgodnie ze specyfikacją
2. **Integracja z Supabase** - autentykacja, sesje, RLS
3. **Middleware** - ochrona zasobów, przekierowania
4. **Testy** - unit testy dla walidacji, e2e testy przepływów

## Więcej informacji

Zobacz szczegółową specyfikację techniczną w [.ai/auth-spec.md](.ai/auth-spec.md).
