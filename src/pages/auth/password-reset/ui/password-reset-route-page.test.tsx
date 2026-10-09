import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { PasswordResetRoutePage } from './password-reset-route-page';

function setup(token?: string) {
  const handlers = { onBack: vi.fn(), onSuccess: vi.fn() };
  render(<PasswordResetRoutePage token={token} {...handlers} />);
  return handlers;
}

describe('PasswordResetRoutePage', () => {
  it('handles a missing token', () => {
    setup(undefined);
    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
  });

  it('resets the password and confirms success', async () => {
    const { onSuccess } = setup('token-123');
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPass123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText('Your password has been reset')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('validates weak and mismatched passwords', async () => {
    setup('token-123');
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('surfaces a reset error', async () => {
    server.use(
      http.post('/api/v1/auth/password-reset/confirm', () =>
        HttpResponse.json({ detail: 'Token expired' }, { status: 400 }),
      ),
    );
    setup('expired');
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPass123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(screen.getByText('Reset failed')).toBeInTheDocument());
    expect(screen.getByText('Token expired')).toBeInTheDocument();
  });
});
