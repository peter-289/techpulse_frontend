import { http, HttpResponse } from 'msw';

const sampleUser = {
  id: 'user-1',
  username: 'e2e_tester',
  full_name: 'E2E Tester',
  email: 'tester@example.test',
  role: 'admin',
};

export const authHandlers = [
  http.post('/api/v1/auth/login', () => HttpResponse.json({ access_token: 'test-token', token_type: 'bearer' })),
  http.post('/api/v1/auth/logout', () => HttpResponse.json({ detail: 'Logged out' })),
  http.post('/api/v1/auth/refresh', () => HttpResponse.json({ access_token: 'test-token' })),
  http.post('/api/v1/auth/password-reset/requests', () =>
    HttpResponse.json({ detail: 'If the e-mail is registered, you will receive a reset link.' }),
  ),
  http.post('/api/v1/auth/password-reset/confirm', () => HttpResponse.json({ detail: 'Password updated' })),
  http.get('/api/v1/auth/email-verification', () => HttpResponse.json({ detail: 'Email verified' })),
  http.post('/api/v1/auth/email-verification/resend', () => HttpResponse.json({ detail: 'Verification email re-sent' })),
  http.get('/api/v1/users/me', () => HttpResponse.json(sampleUser)),
  http.get('/api/v1/users', () =>
    HttpResponse.json([
      { ...sampleUser, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]),
  ),
  http.post('/api/v1/users', () => HttpResponse.json({ id: 'user-2', detail: 'User created' }, { status: 201 })),
];
