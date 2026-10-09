import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { httpClient as api } from '@/shared/api/http-client';
import { getErrorDetail } from '@/shared/lib/api/api-error';
import FeedbackMessage from '@/shared/ui/feedback-message/feedback-message';
import { Button, Card } from '../../../../shared/ui';
import '@/pages/auth/ui/auth.css';

const resetSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((value) => /\d/.test(value), 'Password must contain at least one digit')
      .refine((value) => /[A-Z]/.test(value), 'Password must contain at least one uppercase letter')
      .refine((value) => /[a-z]/.test(value), 'Password must contain at least one lowercase letter'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  });

type ResetValues = z.infer<typeof resetSchema>;

type Props = {
  token?: string | undefined;
  onBack: () => void;
  onSuccess: () => void;
};

export function PasswordResetRoutePage({ token, onBack, onSuccess }: Props) {
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'warning'; title: string; message: string } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { new_password: '', confirm_password: '' },
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async (values) => {
    if (!token) {
      setFeedback({ variant: 'error', title: 'Invalid reset link', message: 'This password reset link is missing its token. Request a new one.' });
      return;
    }
    setFeedback(null);
    try {
      await api.post('/api/v1/auth/password-reset/confirm', {
        token,
        new_password: values.new_password,
      });
      setCompleted(true);
    } catch (err: unknown) {
      const detail = getErrorDetail(err);
      setFeedback({
        variant: 'error',
        title: 'Reset failed',
        message: detail || 'This reset link may be invalid or expired. Request a new one.',
      });
    }
  });

  if (!token) {
    return (
      <div className="tp-auth-page">
        <div className="tp-auth-shell tp-auth-shell-simple">
          <Card className="tp-auth-card">
            <div className="tp-auth-card-top">
              <span className="tp-auth-lock">Encrypted connection</span>
            </div>
            <div className="tp-auth-heading">
              <p className="tp-auth-kicker">Account recovery</p>
              <h1>Invalid reset link</h1>
              <p>This password reset link is invalid or incomplete. Please request a new reset email.</p>
            </div>
            <Button className="tp-auth-submit" type="button" onClick={onBack}>
              Back to sign in
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-auth-page">
      <div className="tp-auth-shell tp-auth-shell-simple">
        <Card className="tp-auth-card">
          <div className="tp-auth-card-top">
            <span className="tp-auth-lock">Encrypted connection</span>
            <button className="tp-auth-back tp-auth-back-inline" type="button" onClick={onBack}>
              Back to login
            </button>
          </div>

          <div className="tp-auth-heading">
            <p className="tp-auth-kicker">Account recovery</p>
            <h1>Choose a new password</h1>
            <p>Set a strong password for your account, then sign in with it.</p>
          </div>

          {completed ? (
            <div className="tp-auth-success">
              <p className="tp-auth-success-label">Password updated</p>
              <h3>Your password has been reset</h3>
              <p>You can now sign in with your new password.</p>
              <div className="tp-auth-success-actions">
                <Button className="tp-auth-submit" type="button" onClick={onSuccess}>
                  Sign in
                </Button>
              </div>
            </div>
          ) : (
            <form className="tp-auth-form" onSubmit={submit} noValidate>
              <div className="tp-auth-field">
                <label htmlFor="new-password">New password</label>
                <div className="tp-input-with-toggle">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={Boolean(form.formState.errors.new_password)}
                    {...form.register('new_password')}
                  />
                  <button
                    className="tp-toggle-password"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.formState.errors.new_password ? (
                  <p className="tp-auth-field-error">{form.formState.errors.new_password.message}</p>
                ) : (
                  <p className="tp-auth-field-hint">Use at least 8 characters with upper and lower case and a digit.</p>
                )}
              </div>

              <div className="tp-auth-field">
                <label htmlFor="confirm-new-password">Confirm new password</label>
                <input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={Boolean(form.formState.errors.confirm_password)}
                  {...form.register('confirm_password')}
                />
                {form.formState.errors.confirm_password ? (
                  <p className="tp-auth-field-error">{form.formState.errors.confirm_password.message}</p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button className="tp-auth-submit" type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Resetting...' : 'Reset password'}
                </Button>
                <Button type="button" variant="secondary" onClick={onBack}>
                  Back
                </Button>
              </div>
            </form>
          )}

          {feedback && (
            <div className="mt-3">
              <FeedbackMessage {...feedback} onClose={() => setFeedback(null)} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
