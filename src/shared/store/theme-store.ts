import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tp-theme';

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

/**
 * Single global theme mechanism for the whole application.
 * The preference is persisted to localStorage and mirrored onto
 * <html data-theme>, which the token layer in `app/styles/tokens.css`
 * reacts to — so every page follows the same switch.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore persistence failures */
    }
    set({ theme });
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },
}));

applyTheme(useThemeStore.getState().theme);
