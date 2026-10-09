import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { LoginRoutePage } from './login-route-page';

function setup() {
  const handlers = {
    onLogin: vi.fn().mockResolvedValue(undefined),
    onForgot: vi.fn(),
    onRegister: vi.fn(),
    onBack: vi.fn(),
  };
  render(<LoginRoutePage {...handlers} />);
  return handlers;
}

function fill(username: string, password: string) {
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
}

describe('LoginRoutePage', () => {
  it('validates required fields', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('signs in successfully', async () => {
    const { onLogin } = setup();
    fill('ada', 'secret');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
  });

  it('shows an invalid credential notice on 401', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ detail: 'Bad credentials' }, { status: 401 }),
      ),
    );
    const { onLogin } = setup();
    fill('ada', 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Sign-in failed')).toBeInTheDocument();
    expect(screen.getByText('Invalid username or password.')).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('navigates to forgot password and register', () => {
    const { onForgot, onRegister } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create one' }));
    expect(onForgot).toHaveBeenCalled();
    expect(onRegister).toHaveBeenCalled();
  });
});
