import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import qs from 'qs';
import { authApi } from '../../../../API_Wrapper';
import { Button, Card } from '../../../../shared/ui';
import '../../../../LoginPage.css';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type AuthNotice = {
  title: string;
  message: string;
};

type Props = {
  onBack: () => void;
  onLogin: () => Promise<void> | void;
  onForgot: () => void;
  onRegister: () => void;
};

function getLoginErrorMessage(error: any) {
  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return 'Invalid username or password.';
  }

  if (status === 429) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }

  if (!error?.response) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  return 'Something went wrong. Please try again.';
}

function AuthSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="tp-auth-heading">
      <p className="tp-auth-kicker">Welcome back</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function LoginRoutePage({ onBack, onLogin, onForgot, onRegister }: Props) {
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async (values) => {
    setNotice(null);
    try {
      await authApi.post('/api/v1/auth/login', qs.stringify(values), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      await onLogin();
    } catch (error: any) {
      setNotice({
        title: 'Sign-in failed',
        message: getLoginErrorMessage(error),
      });
    }
  });

  const usernameError = form.formState.errors.username?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <div className="tp-auth-page">
      <div className="tp-auth-shell">
        <aside className="tp-auth-panel">
          <div className="tp-auth-brand">
            <span className="tp-auth-badge">Tech Pulse</span>
            <h2>Secure. Simple. Familiar.</h2>
            <p>Sign in to continue to the same software verification platform you saw on the landing page.</p>
          </div>

          <ul className="tp-auth-panel-list" aria-label="Authentication benefits">
            <li>
              <strong>Workspace access</strong>
              <span>Review artifacts, reports, and release evidence from one place.</span>
            </li>
            <li>
              <strong>Developer friendly</strong>
              <span>Fast sign-in, clear states, and predictable recovery paths.</span>
            </li>
            <li>
              <strong>Security conscious</strong>
              <span>Encrypted sessions and cautious error handling by default.</span>
            </li>
          </ul>

          <button className="tp-auth-back" type="button" onClick={onBack}>
            Back to landing
          </button>
        </aside>

        <Card className="tp-auth-card">
          <div className="tp-auth-card-top">
            <span className="tp-auth-lock">Encrypted connection</span>
            <button className="tp-auth-back tp-auth-back-inline" type="button" onClick={onBack}>
              Back to home
            </button>
          </div>

          <AuthSection
            title="Welcome back"
            description="Sign in to continue to your workspace."
          />

          <form className="tp-auth-form" onSubmit={submit} noValidate>
            {notice ? (
              <div className="tp-auth-banner" role="alert" aria-live="polite">
                <strong>{notice.title}</strong>
                <p>{notice.message}</p>
              </div>
            ) : null}

            <div className="tp-auth-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="your.username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={Boolean(usernameError)}
                aria-describedby={usernameError ? 'username-error' : 'username-help'}
                {...form.register('username')}
              />
              {usernameError ? (
                <p className="tp-auth-field-error" id="username-error">
                  {usernameError}
                </p>
              ) : (
                <p className="tp-auth-field-hint" id="username-help">
                  Use the username tied to your account.
                </p>
              )}
            </div>

            <div className="tp-auth-field">
              <div className="tp-auth-field-row">
                <label htmlFor="password">Password</label>
                <button
                  className="tp-auth-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : 'password-help'}
                {...form.register('password')}
              />
              {passwordError ? (
                <p className="tp-auth-field-error" id="password-error">
                  {passwordError}
                </p>
              ) : (
                <p className="tp-auth-field-hint" id="password-help">
                  Keep your credentials private on shared devices.
                </p>
              )}
            </div>

            <div className="tp-auth-links">
              <button className="tp-auth-link" type="button" onClick={onForgot}>
                Forgot password?
              </button>
            </div>

            <Button className="tp-auth-submit" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="tp-auth-footer">
            <span>Don't have an account?</span>
            <button className="tp-auth-register" type="button" onClick={onRegister}>
              Create one
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
