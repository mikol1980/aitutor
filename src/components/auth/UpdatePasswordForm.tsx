// ============================================================================
// Update Password Form Component
// ============================================================================
// Set new password after reset

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import { AuthSuccessMessage } from './AuthSuccessMessage';

interface UpdatePasswordFormProps {
  isValidToken: boolean;
}

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

/**
 * Update password form component
 * Allows user to set new password after password reset
 */
export function UpdatePasswordForm({ isValidToken }: UpdatePasswordFormProps) {
  const [formState, setFormState] = useState<UpdatePasswordFormState>({
    password: '',
    passwordConfirm: '',
    isSubmitting: false,
    success: false,
    error: null,
    validationErrors: {},
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Auto-redirect after success
  useEffect(() => {
    if (formState.success) {
      const timer = setTimeout(() => {
        window.location.href = '/auth/login';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formState.success]);

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Hasło jest wymagane';
    if (password.length < 8) return 'Hasło musi mieć minimum 8 znaków';

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);

    if (!hasUppercase) return 'Hasło musi zawierać przynajmniej jedną wielką literę';
    if (!hasLowercase) return 'Hasło musi zawierać przynajmniej jedną małą literę';
    if (!hasDigit) return 'Hasło musi zawierać przynajmniej jedną cyfrę';

    return undefined;
  };

  const validatePasswordConfirm = (password: string, passwordConfirm: string): string | undefined => {
    if (!passwordConfirm) return 'Potwierdzenie hasła jest wymagane';
    if (password !== passwordConfirm) return 'Hasła nie są identyczne';
    return undefined;
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(formState.password);
    setFormState(prev => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, password: error },
    }));
  };

  const handlePasswordConfirmBlur = () => {
    const error = validatePasswordConfirm(formState.password, formState.passwordConfirm);
    setFormState(prev => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, passwordConfirm: error },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const passwordError = validatePassword(formState.password);
    const passwordConfirmError = validatePasswordConfirm(formState.password, formState.passwordConfirm);

    if (passwordError || passwordConfirmError) {
      setFormState(prev => ({
        ...prev,
        validationErrors: {
          password: passwordError,
          passwordConfirm: passwordConfirmError,
        },
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // TODO: Implement password update when backend is ready
      // await supabase.auth.updateUser({ password: formState.password });

      // Mock for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setFormState(prev => ({ ...prev, isSubmitting: false, success: true }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.';

      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }));
    }
  };

  // Invalid token UI
  if (!isValidToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link wygasł lub jest nieprawidłowy</CardTitle>
          <CardDescription>Nie można zresetować hasła</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Link do resetowania hasła wygasł lub został już użyty.
          </p>

          <Button asChild className="w-full">
            <a href="/auth/reset-password">Wyślij nowy link</a>
          </Button>

          <div className="text-center text-sm">
            <a href="/auth/login" className="text-primary hover:underline">
              Powrót do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success UI
  if (formState.success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hasło zostało zmienione!</CardTitle>
          <CardDescription>Za chwilę zostaniesz przekierowany</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthSuccessMessage message="Hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany do strony logowania..." />

          <Button asChild className="w-full">
            <a href="/auth/login">Zaloguj się teraz</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Form UI
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło do konta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formState.error && (
            <AuthError
              message={formState.error}
              onDismiss={() => setFormState(prev => ({ ...prev, error: null }))}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formState.password}
                onChange={e =>
                  setFormState(prev => ({ ...prev, password: e.target.value }))
                }
                onBlur={handlePasswordBlur}
                error={!!formState.validationErrors.password}
                disabled={formState.isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    <>
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {formState.validationErrors.password && (
              <p className="text-sm text-destructive">
                {formState.validationErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Potwierdź hasło</Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={formState.passwordConfirm}
                onChange={e =>
                  setFormState(prev => ({ ...prev, passwordConfirm: e.target.value }))
                }
                onBlur={handlePasswordConfirmBlur}
                error={!!formState.validationErrors.passwordConfirm}
                disabled={formState.isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPasswordConfirm ? 'Ukryj hasło' : 'Pokaż hasło'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPasswordConfirm ? (
                    <>
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {formState.validationErrors.passwordConfirm && (
              <p className="text-sm text-destructive">
                {formState.validationErrors.passwordConfirm}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? 'Zmiana hasła...' : 'Zmień hasło'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
