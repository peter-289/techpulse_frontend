import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import qs from 'qs';
import api from '../../../../API_Wrapper';
import FeedbackMessage from '../../../../components/FeedbackMessage';
import { Button, Card, Input } from '../../../../shared/ui';

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
    } catch (err: any) {
      setFeedback({ variant: 'error', title: 'Request failed', message: err?.response?.data?.detail || 'Failed to submit.' });
    }
  });

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <h1 className="mb-2 text-xl font-semibold text-white">Forgot your password?</h1>
        <p className="mb-3 text-sm text-slate-300">Enter your account email and we will send a reset link.</p>
        <form className="space-y-3" onSubmit={submit}>
          <Input type="email" placeholder="you@company.com" autoComplete="email" {...form.register('email')} />
          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}</Button>
            <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
          </div>
        </form>
        {feedback && <div className="mt-3"><FeedbackMessage {...feedback} onClose={() => setFeedback(null)} /></div>}
      </Card>
    </div>
  );
}
