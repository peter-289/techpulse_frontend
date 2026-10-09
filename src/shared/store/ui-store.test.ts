import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './ui-store';

beforeEach(() => {
  useUiStore.setState({ sidebarCollapsed: false, commandPaletteOpen: false, helpCentreOpen: false });
});

describe('useUiStore', () => {
  it('toggles the sidebar', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it('controls the command palette', () => {
    useUiStore.getState().setCommandPaletteOpen(true);
    expect(useUiStore.getState().commandPaletteOpen).toBe(true);
  });

  it('controls the help centre explicitly and via toggle', () => {
    useUiStore.getState().setHelpCentreOpen(true);
    expect(useUiStore.getState().helpCentreOpen).toBe(true);
    useUiStore.getState().toggleHelpCentre();
    expect(useUiStore.getState().helpCentreOpen).toBe(false);
  });
});
