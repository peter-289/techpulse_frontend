import { create } from 'zustand';

type UiState = {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  helpCentreOpen: boolean;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setHelpCentreOpen: (open: boolean) => void;
  toggleHelpCentre: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  helpCentreOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setHelpCentreOpen: (open) => set({ helpCentreOpen: open }),
  toggleHelpCentre: () => set((state) => ({ helpCentreOpen: !state.helpCentreOpen })),
}));
