import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import qs from 'qs';
import { authApi } from '../../../../API_Wrapper';
import FeedbackMessage from '../../../../components/FeedbackMessage';
import { Button, Card, Input } from '../../../../shared/ui';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type Props = {
  onBack: () => void;
  onLogin: () => Promise<void> | void;
  onForgot: () => void;
};

export function LoginRoutePage({ onBack, onLogin, onForgot }: Props) {
  const [feedback, setFeedback] = useState<any>(null);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { username: '', password: '' } });

  const submit = form.handleSubmit(async (values) => {
    setFeedback(null);
    try {
      await authApi.post('/api/v1/auth/login', qs.stringify(values), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      setFeedback({ variant: 'success', title: 'Authentication successful', message: 'Welcome back! Redirecting to your workspace.' });
      await onLogin();
    } catch (err: any) {
      setFeedback({ variant: 'error', title: 'Unable to authenticate', message: err?.response?.data?.detail || err?.message || 'Login failed.' });
    }
  });

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <h1 className="mb-3 text-xl font-semibold text-white">Sign In</h1>
        <form className="space-y-3" onSubmit={submit}>
          <Input placeholder="Username" autoComplete="username" {...form.register('username')} />
          <Input type="password" placeholder="Password" autoComplete="current-password" {...form.register('password')} />
          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Logging in...' : 'Login'}</Button>
            <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
            <Button type="button" variant="ghost" onClick={onForgot}>Forgot password?</Button>
          </div>
        </form>
        {feedback && <div className="mt-3"><FeedbackMessage {...feedback} onClose={() => setFeedback(null)} /></div>}
      </Card>
    </div>
  );
}
