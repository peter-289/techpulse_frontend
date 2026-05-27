import { create } from 'zustand';

type SessionUser = Record<string, unknown> | null;

type SessionState = {
  isLoggedIn: boolean;
  user: SessionUser;
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isLoggedIn: false,
  user: null,
  setSession: (user) => set({ isLoggedIn: !!user, user }),
  clearSession: () => set({ isLoggedIn: false, user: null }),
}));
