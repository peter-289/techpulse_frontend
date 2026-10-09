import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import qs from 'qs';
import { httpClient as api } from '@/shared/api/http-client';
import { getErrorDetail } from '@/shared/lib/api/api-error';
import FeedbackMessage from '@/shared/ui/feedback-message/feedback-message';
import { Button, Card, Input } from '../../../../shared/ui';
import '@/pages/auth/ui/auth.css';

const forgotSchema = z.object({
  email: z.email('Enter a valid email address'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

type Props = {
  onBack: () => void;
  onCheckEmail: () => void;
};

export function ForgotPasswordRoutePage({ onBack, onCheckEmail }: Props) {
  const [feedback, setFeedback] = useState<any>(null);
  const form = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const submit = form.handleSubmit(async (values) => {
    setFeedback(null);
    try {
      const res = await api.post('/api/v1/auth/password-reset/requests', qs.stringify(values), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      setFeedback({ variant: 'success', title: 'Reset link sent', message: res.data?.detail || 'If the e-mail is registered, you will receive a reset link.' });
      onCheckEmail();
    } catch (err: unknown) {
      setFeedback({ variant: 'error', title: 'Request failed', message: getErrorDetail(err) || 'Failed to submit.' });
    }
  });

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
            <h1>Forgot your password?</h1>
            <p>Enter your account email and we will send a reset link.</p>
          </div>
          <form className="tp-auth-form" onSubmit={submit} noValidate>
            <div className="tp-auth-field">
              <label htmlFor="forgot-email">Email address</label>
              <Input id="forgot-email" type="email" placeholder="you@company.com" autoComplete="email" {...form.register('email')} />
            </div>
            <div className="flex gap-2">
              <Button className="tp-auth-submit" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
              <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
            </div>
          </form>
          {feedback && <div className="mt-3"><FeedbackMessage {...feedback} onClose={() => setFeedback(null)} /></div>}
        </Card>
      </div>
    </div>
  );
}
