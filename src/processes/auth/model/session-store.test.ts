import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from './session-store';

beforeEach(() => {
  useSessionStore.setState({ isLoggedIn: false, user: null, isHydrated: false });
});

describe('useSessionStore', () => {
  it('sets a session and marks the user logged in', () => {
    useSessionStore.getState().setSession({ id: 'u1', username: 'ada' });
    expect(useSessionStore.getState().isLoggedIn).toBe(true);
    expect(useSessionStore.getState().user).toMatchObject({ username: 'ada' });
  });

  it('clears a session', () => {
    useSessionStore.getState().setSession({ id: 'u1' });
    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState()).toMatchObject({ isLoggedIn: false, user: null });
  });

  it('tracks hydration', () => {
    useSessionStore.getState().setHydrated(true);
    expect(useSessionStore.getState().isHydrated).toBe(true);
  });

  it('treats a null user as logged out', () => {
    useSessionStore.getState().setSession(null);
    expect(useSessionStore.getState().isLoggedIn).toBe(false);
  });
});
