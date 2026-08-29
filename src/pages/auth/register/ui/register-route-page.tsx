import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../../../API_Wrapper';
import FeedbackMessage from '../../../../components/FeedbackMessage';
import { Button, Card } from '../../../../shared/ui';
import '../../../../LoginPage.css';

const registrationSchema = z
  .object({
    fullname: z.string().min(1, 'Full name is required'),
    username: z.string().min(1, 'Username is required'),
    email: z.email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((value) => /\d/.test(value), 'Password must contain at least one digit')
      .refine((value) => /[A-Z]/.test(value), 'Password must contain at least one uppercase letter')
      .refine((value) => /[a-z]/.test(value), 'Password must contain at least one lowercase letter'),
    confirm_password: z.string().min(1, 'Please confirm password'),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  });

type RegistrationValues = z.infer<typeof registrationSchema>;

type Props = {
  onBack: () => void;
  onLogin: () => void;
};

type AuthNotice = {
  title: string;
  message: string;
  actionLabel?: string;
  action?: () => void;
  variant?: 'success' | 'error' | 'info' | 'warning';
};

function getRegistrationErrorMessage(error: any) {
  const status = error?.response?.status;
  const detail = String(error?.response?.data?.detail || error?.message || '').toLowerCase();

  if (status === 409 || detail.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (status === 429) {
    return 'Too many registration attempts. Please wait a moment and try again.';
  }

  if (!error?.response) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  return 'Something went wrong while creating your account. Please try again.';
}

function PasswordChecklist({ password }: { password: string }) {
  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One digit', met: /\d/.test(password) },
  ];

  return (
    <ul className="tp-password-rules" aria-label="Password requirements">
      {requirements.map((item) => (
        <li key={item.label} className={item.met ? 'ok' : ''}>
          {item.met ? '✓' : '•'} {item.label}
        </li>
      ))}
    </ul>
  );
}

function AuthField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="tp-auth-field">
      <label>{label}</label>
      {children}
      {error ? (
        <p className="tp-auth-field-error">{error}</p>
      ) : hint ? (
        <p className="tp-auth-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function RegisterRoutePage({ onBack, onLogin }: Props) {
  const [feedback, setFeedback] = useState<AuthNotice | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullname: '', username: '', email: '', password: '', confirm_password: '' },
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async (values) => {
    setFeedback(null);
    try {
      const payload = {
        full_name: values.fullname,
        username: values.username,
        email: values.email,
        password: values.password,
      };

      const response = await api.post('/api/v1/users', payload);
      setVerificationEmail(values.email);
      setFeedback({
        title: 'Account created',
        message: response.data?.message || `We've sent a verification link to ${values.email}. Check your inbox to verify your account.`,
        variant: 'success',
        actionLabel: 'Sign in',
        action: onLogin,
      });
      form.reset();
    } catch (error: any) {
      setFeedback({
        title: 'Registration failed',
        message: getRegistrationErrorMessage(error),
        variant: 'error',
        actionLabel: 'Sign in',
        action: onLogin,
      });
    }
  });

  const fullnameError = form.formState.errors.fullname?.message;
  const usernameError = form.formState.errors.username?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmPasswordError = form.formState.errors.confirm_password?.message;
  const passwordValue = form.watch('password');

  const isSuccess = Boolean(verificationEmail);

  return (
    <div className="tp-auth-page">
      <div className="tp-auth-shell tp-auth-shell-register">
        <aside className="tp-auth-panel">
          <div className="tp-auth-brand">
            <span className="tp-auth-badge">Tech Pulse</span>
            <h2>Create your account</h2>
            <p>Start verifying the software you build, distribute, and deploy.</p>
          </div>

          <ul className="tp-auth-panel-list" aria-label="Registration notes">
            <li>
              <strong>Minimum friction</strong>
              <span>We only ask for the details needed to create your account.</span>
            </li>
            <li>
              <strong>Verification ready</strong>
              <span>Registration naturally leads into email verification and sign-in.</span>
            </li>
            <li>
              <strong>Consistent system</strong>
              <span>The same visual language carries through landing, login, and registration.</span>
            </li>
          </ul>

          <button className="tp-auth-back" type="button" onClick={onBack}>
            Back to landing
          </button>
        </aside>

        <Card className="tp-auth-card">
          <div className="tp-auth-card-top">
            <span className="tp-auth-lock">Encrypted connection</span>
            <button className="tp-auth-back tp-auth-back-inline" type="button" onClick={onLogin}>
              Already have an account?
            </button>
          </div>

          <div className="tp-auth-heading">
            <p className="tp-auth-kicker">Welcome</p>
            <h1>Create your account</h1>
            <p>Start verifying the software you build, distribute, and deploy.</p>
          </div>

          {feedback ? (
            <div
              className={`tp-auth-banner tp-auth-banner-${feedback.variant || 'info'}`}
              role={feedback.variant === 'error' ? 'alert' : 'status'}
              aria-live={feedback.variant === 'error' ? 'assertive' : 'polite'}
            >
              <strong>{feedback.title}</strong>
              <p>{feedback.message}</p>
              {feedback.action ? (
                <button className="tp-auth-banner-action" type="button" onClick={feedback.action}>
                  {feedback.actionLabel || 'Continue'}
                </button>
              ) : null}
            </div>
          ) : null}

          {isSuccess ? (
            <div className="tp-auth-success">
              <p className="tp-auth-success-label">Verification email sent</p>
              <h3>{verificationEmail}</h3>
              <p>Check your inbox to verify your account, then sign in to continue.</p>
              <div className="tp-auth-success-actions">
                <Button className="tp-auth-submit" type="button" onClick={onLogin}>
                  Sign in
                </Button>
                <Button className="tp-auth-secondary-button" type="button" variant="secondary" onClick={onBack}>
                  Back to home
                </Button>
              </div>
            </div>
          ) : (
            <form className="tp-auth-form" onSubmit={submit} noValidate>
              <AuthField label="Full name" error={fullnameError} hint="Use the name you want associated with your workspace.">
                <input
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  aria-invalid={Boolean(fullnameError)}
                  {...form.register('fullname')}
                />
              </AuthField>

              <AuthField label="Username" error={usernameError} hint="This is used to identify your account.">
                <input
                  type="text"
                  placeholder="your.username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={Boolean(usernameError)}
                  {...form.register('username')}
                />
              </AuthField>

              <AuthField label="Email address" error={emailError} hint="We’ll send verification instructions here.">
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={Boolean(emailError)}
                  {...form.register('email')}
                />
              </AuthField>

              <AuthField label="Password" error={passwordError}>
                <div className="tp-input-with-toggle">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby="password-requirements"
                    {...form.register('password')}
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
                <div id="password-requirements">
                  <PasswordChecklist password={passwordValue} />
                </div>
              </AuthField>

              <AuthField label="Confirm password" error={confirmPasswordError} hint="Both password fields should match.">
                <div className="tp-input-with-toggle">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={Boolean(confirmPasswordError)}
                    {...form.register('confirm_password')}
                  />
                  <button
                    className="tp-toggle-password"
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-pressed={showConfirmPassword}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </AuthField>

              <Button className="tp-auth-submit" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          )}

          {!isSuccess ? (
            <div className="tp-auth-footer">
              <span>Already have an account?</span>
              <button className="tp-auth-register" type="button" onClick={onLogin}>
                Sign in
              </button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
