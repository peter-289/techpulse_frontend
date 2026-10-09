import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from './theme-store';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  window.localStorage.clear();
});

describe('useThemeStore', () => {
  it('applies a theme to the document and persists it', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('tp-theme')).toBe('dark');
  });

  it('toggles between light and dark', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
