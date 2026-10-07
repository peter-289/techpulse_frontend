import { create } from 'zustand';

type SessionUser = Record<string, unknown> | null;

type SessionState = {
  isLoggedIn: boolean;
  user: SessionUser;
  isHydrated: boolean;
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
};

// Zustand store for managing user session state
export const useSessionStore = create<SessionState>((set) => ({
  isLoggedIn: false,
  user: null,
  isHydrated: false,
  setSession: (user) => set({ isLoggedIn: !!user, user }),
  clearSession: () => set({ isLoggedIn: false, user: null }),
  setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
}));
