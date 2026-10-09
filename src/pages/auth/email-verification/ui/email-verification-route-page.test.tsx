import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { EmailVerificationRoutePage } from './email-verification-route-page';

function setup(token?: string) {
  const handlers = { onBack: vi.fn(), onLogin: vi.fn() };
  render(<EmailVerificationRoutePage token={token} {...handlers} />);
  return handlers;
}

describe('EmailVerificationRoutePage', () => {
  it('handles a missing token', () => {
    setup(undefined);
    expect(screen.getByText('Verification failed')).toBeInTheDocument();
    expect(screen.getByText('This verification link is missing its token.')).toBeInTheDocument();
  });

  it('verifies successfully', async () => {
    setup('valid-token');
    expect(await screen.findByRole('heading', { name: 'Email verified' })).toBeInTheDocument();
  });

  it('surfaces a verification failure', async () => {
    server.use(
      http.get('/api/v1/auth/email-verification', () =>
        HttpResponse.json({ detail: 'Token invalid' }, { status: 400 }),
      ),
    );
    setup('bad-token');
    expect(await screen.findByText('Verification failed')).toBeInTheDocument();
    expect(screen.getByText('Token invalid')).toBeInTheDocument();
  });
});
