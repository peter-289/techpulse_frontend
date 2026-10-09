import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { RegisterRoutePage } from './register-route-page';

function setup() {
  const handlers = { onBack: vi.fn(), onLogin: vi.fn() };
  render(<RegisterRoutePage {...handlers} />);
  return handlers;
}

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Ada Lovelace' } });
  fireEvent.change(screen.getByPlaceholderText('your.username'), { target: { value: 'ada' } });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'ada@example.test' } });
  const passwords = screen.getAllByPlaceholderText('••••••••');
  fireEvent.change(passwords[0]!, { target: { value: 'StrongPass1' } });
  fireEvent.change(passwords[1]!, { target: { value: 'StrongPass1' } });
}

describe('RegisterRoutePage', () => {
  it('validates required fields', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
  });

  it('registers and shows the verification step', async () => {
    setup();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Verification email sent')).toBeInTheDocument();
    expect(screen.getByText('ada@example.test')).toBeInTheDocument();
  });

  it('reports an existing account', async () => {
    server.use(
      http.post('/api/v1/users', () =>
        HttpResponse.json({ detail: 'User already exists' }, { status: 409 }),
      ),
    );
    setup();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(
        screen.getByText('An account with this email already exists. Try signing in instead.'),
      ).toBeInTheDocument(),
    );
  });
});
