import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../../../API_Wrapper';
import FeedbackMessage from '../../../../components/FeedbackMessage';
import { Button, Card, Input } from '../../../../shared/ui';

const registrationSchema = z.object({
  fullname: z.string().min(1, 'Full name is required'),
  username: z.string().min(1, 'Username is required'),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm password'),
}).refine((values) => values.password === values.confirm_password, {
  message: 'Passwords do not match.',
  path: ['confirm_password'],
});

type RegistrationValues = z.infer<typeof registrationSchema>;

type Props = {
  onBack: () => void;
  onRegistered: () => void;
};

export function RegisterRoutePage({ onBack, onRegistered }: Props) {
  const [feedback, setFeedback] = useState<any>(null);
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullname: '', username: '', email: '', password: '', confirm_password: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    setFeedback(null);
    try {
      const payload = { full_name: values.fullname, username: values.username, email: values.email, password: values.password };
      const response = await api.post('/api/v1/users', payload);
      setFeedback({ title: 'Registration complete', message: response.data?.detail || 'Registration successful.', variant: 'success' });
      form.reset();
      setTimeout(() => onRegistered(), 700);
    } catch (err: any) {
      setFeedback({ title: 'Registration failed', message: err?.response?.data?.detail || 'Network error. Please try again.', variant: 'error' });
    }
  });

  return (
    <div className="mx-auto max-w-md py-10 px-4">
      <Card>
        <h1 className="mb-3 text-xl font-semibold text-white">Create Account</h1>
        <p className="mb-4 text-sm tp-muted">Create an account to start publishing and managing software artifacts for your organization.</p>

        <form className="space-y-3" onSubmit={submit}>
          <Input placeholder="Full name" autoComplete="name" {...form.register('fullname')} />
          <Input placeholder="Username" autoComplete="username" {...form.register('username')} />
          <Input type="email" placeholder="Email" autoComplete="email" {...form.register('email')} />
          <Input type="password" placeholder="Password" autoComplete="new-password" {...form.register('password')} />
          <Input type="password" placeholder="Confirm Password" autoComplete="new-password" {...form.register('confirm_password')} />

          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button className="w-full sm:w-auto" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Registering...' : 'Register'}</Button>
            <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={onBack}>Back</Button>
          </div>
        </form>

        {feedback && <div className="mt-3"><FeedbackMessage {...feedback} onClose={() => setFeedback(null)} /></div>}
      </Card>
    </div>
  );
}
