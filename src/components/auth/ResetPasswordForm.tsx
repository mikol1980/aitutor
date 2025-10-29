// ============================================================================
// Reset Password Form Component
// ============================================================================
// Request password reset email

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import { AuthSuccessMessage } from './AuthSuccessMessage';

interface ResetPasswordFormProps {
  emailSent?: boolean;
}

interface ResetPasswordFormState {
  email: string;
  isSubmitting: boolean;
  emailSent: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
  };
}

/**
 * Reset password form component
 * Sends password reset email to user
 */
export function ResetPasswordForm({ emailSent = false }: ResetPasswordFormProps) {
  const [formState, setFormState] = useState<ResetPasswordFormState>({
    email: '',
    isSubmitting: false,
    emailSent: emailSent,
    error: null,
    validationErrors: {},
  });

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email jest wymagany';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Nieprawidłowy format email';
    return undefined;
  };

  const handleEmailBlur = () => {
    const error = validateEmail(formState.email);
    setFormState(prev => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, email: error },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailError = validateEmail(formState.email);

    if (emailError) {
      setFormState(prev => ({
        ...prev,
        validationErrors: { email: emailError },
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // TODO: Implement password reset when backend is ready
      // await supabase.auth.resetPasswordForEmail(email, {
      //   redirectTo: `${window.location.origin}/auth/update-password`,
      // });

      // Mock for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setFormState(prev => ({ ...prev, isSubmitting: false, emailSent: true }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd. Spróbuj ponownie.';

      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }));
    }
  };

  if (formState.emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email wysłany!</CardTitle>
          <CardDescription>Sprawdź swoją skrzynkę pocztową</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthSuccessMessage message="Jeśli konto z tym adresem email istnieje, wyślemy link do resetowania hasła. Sprawdź swoją skrzynkę pocztową (także spam)." />

          <div className="text-center text-sm">
            <a href="/auth/login" className="text-primary hover:underline">
              Powrót do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Resetowanie hasła</CardTitle>
        <CardDescription>Podaj email przypisany do konta</CardDescription>
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

          <Button
            type="submit"
            className="w-full"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetujący'}
          </Button>

          <div className="text-center text-sm">
            <a href="/auth/login" className="text-primary hover:underline">
              Powrót do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
