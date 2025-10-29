// ============================================================================
// Register Form Component
// ============================================================================
// User registration form

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import { AuthSuccessMessage } from './AuthSuccessMessage';
import type { RegisterRequest, RegisterResponse } from '@/types';

interface RegisterFormState {
  login: string;
  email: string;
  password: string;
  passwordConfirm: string;
  isSubmitting: boolean;
  registrationComplete: boolean;
  error: string | null;
  validationErrors: {
    login?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  };
}

/**
 * Registration form component
 * Handles new user registration
 * MVP: Auto-login after successful registration
 */
export function RegisterForm() {
  const [formState, setFormState] = useState<RegisterFormState>({
    login: '',
    email: '',
    password: '',
    passwordConfirm: '',
    isSubmitting: false,
    registrationComplete: false,
    error: null,
    validationErrors: {},
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const validateLogin = (login: string): string | undefined => {
    if (!login) return 'Login jest wymagany';
    if (login.length < 3) return 'Login musi mieć minimum 3 znaki';
    if (login.length > 30) return 'Login może mieć maksymalnie 30 znaków';
    const loginRegex = /^[a-zA-Z0-9_-]+$/;
    if (!loginRegex.test(login)) {
      return 'Login może zawierać tylko litery, cyfry, _ oraz -';
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email jest wymagany';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Nieprawidłowy format email';
    return undefined;
  };

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

  const handleLoginBlur = () => {
    const error = validateLogin(formState.login);
    setFormState(prev => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, login: error },
    }));
  };

  const handleEmailBlur = () => {
    const error = validateEmail(formState.email);
    setFormState(prev => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, email: error },
    }));
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
    const loginError = validateLogin(formState.login);
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);
    const passwordConfirmError = validatePasswordConfirm(formState.password, formState.passwordConfirm);

    if (loginError || emailError || passwordError || passwordConfirmError) {
      setFormState(prev => ({
        ...prev,
        validationErrors: {
          login: loginError,
          email: emailError,
          password: passwordError,
          passwordConfirm: passwordConfirmError,
        },
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Call register API endpoint
      const requestBody: RegisterRequest = {
        login: formState.login,
        email: formState.email,
        password: formState.password,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API error response
        const errorMessage = data.error?.message || 'Wystąpił błąd podczas rejestracji.';
        throw new Error(errorMessage);
      }

      // Success - show success message and redirect after 2 seconds
      const registerResponse = data as RegisterResponse;
      console.log('Registration successful:', registerResponse.user.email);

      setFormState(prev => ({ ...prev, registrationComplete: true }));

      // Redirect to dashboard after showing success message
      setTimeout(() => {
        window.location.href = '/app/dashboard';
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';

      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }));
    }
  };

  if (formState.registrationComplete) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Witaj w AI Tutor!</CardTitle>
          <CardDescription>Twoje konto zostało utworzone</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthSuccessMessage message="Twoje konto zostało utworzone i jesteś zalogowany. Za chwilę zostaniesz przekierowany do dashboardu..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Dołącz do AI Tutor</CardTitle>
        <CardDescription>Utwórz konto, aby rozpocząć naukę</CardDescription>
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
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              placeholder="jan_kowalski"
              value={formState.login}
              onChange={e =>
                setFormState(prev => ({ ...prev, login: e.target.value }))
              }
              onBlur={handleLoginBlur}
              error={!!formState.validationErrors.login}
              disabled={formState.isSubmitting}
              autoComplete="username"
            />
            {formState.validationErrors.login && (
              <p className="text-sm text-destructive">
                {formState.validationErrors.login}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jan@example.com"
              value={formState.email}
              onChange={e =>
                setFormState(prev => ({ ...prev, email: e.target.value }))
              }
              onBlur={handleEmailBlur}
              error={!!formState.validationErrors.email}
              disabled={formState.isSubmitting}
              autoComplete="email"
            />
            {formState.validationErrors.email && (
              <p className="text-sm text-destructive">
                {formState.validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
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
            <p className="text-xs text-muted-foreground">
              Min. 8 znaków, wielka litera, mała litera i cyfra
            </p>
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
            {formState.isSubmitting ? 'Rejestracja...' : 'Zarejestruj się'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Masz już konto? </span>
            <a href="/auth/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
