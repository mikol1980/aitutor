// ============================================================================
// Login Form Component
// ============================================================================
// User login form with email and password

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import type { LoginRequest, LoginResponse } from '@/types';

interface LoginFormProps {
  redirectTo?: string;
}

interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
    password?: string;
  };
}

/**
 * Login form component
 * Handles user authentication with email and password
 */
export function LoginForm({ redirectTo = '/app/dashboard' }: LoginFormProps) {
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    isSubmitting: false,
    error: null,
    validationErrors: {},
  });

  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email jest wymagany';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Podaj prawidłowy adres email';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Hasło jest wymagane';
    if (password.length < 6) return 'Hasło musi mieć minimum 6 znaków';
    return undefined;
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    if (emailError || passwordError) {
      setFormState(prev => ({
        ...prev,
        validationErrors: {
          email: emailError,
          password: passwordError,
        },
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Call login API endpoint
      const requestBody: LoginRequest = {
        email: formState.email,
        password: formState.password,
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API error response
        const errorMessage = data.error?.message || 'Wystąpił błąd podczas logowania.';
        throw new Error(errorMessage);
      }

      // Success - redirect to dashboard or specified URL
      const loginResponse = data as LoginResponse;
      console.log('Login successful:', loginResponse.user.email);

      // Redirect to the target page
      window.location.href = redirectTo;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';

      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Witaj ponownie</CardTitle>
        <CardDescription>Zaloguj się do swojego konta</CardDescription>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <a
                href="/auth/reset-password"
                className="text-sm text-primary hover:underline"
              >
                Zapomniałeś?
              </a>
            </div>
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
                autoComplete="current-password"
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

          <Button
            type="submit"
            className="w-full"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
