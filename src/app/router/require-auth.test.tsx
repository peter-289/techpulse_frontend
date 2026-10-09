import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from '../../processes/auth/model/session-store';
import { RequireAuth } from './require-auth';

function renderAt(path = '/workspace') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/workspace" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useSessionStore.setState({ isLoggedIn: false, user: null, isHydrated: false });
});

describe('RequireAuth', () => {
  it('shows a loading state while the session hydrates', () => {
    renderAt();
    expect(screen.getByRole('status')).toHaveTextContent('Restoring your session…');
  });

  it('redirects to login once hydrated and unauthenticated', () => {
    useSessionStore.setState({ isHydrated: true, isLoggedIn: false });
    renderAt();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders the protected route when authenticated', () => {
    useSessionStore.setState({ isHydrated: true, isLoggedIn: true, user: { id: 'u1' } });
    renderAt();
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
