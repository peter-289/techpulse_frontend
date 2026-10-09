import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from '../../../processes/auth/model/session-store';
import { useUiStore } from '../../../shared/store/ui-store';
import { CommandPalette } from './command-palette';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPalette() {
  return render(
    <MemoryRouter initialEntries={['/workspace/overview']}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <CommandPalette />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useUiStore.setState({ commandPaletteOpen: true });
  useSessionStore.setState({ isLoggedIn: true, isHydrated: true, user: { id: 'u1', role: 'viewer' } });
});

describe('CommandPalette', () => {
  it('lists workspace destinations and hides admin-only items for non-admins', () => {
    renderPalette();
    expect(screen.getByPlaceholderText('Search workspaces, software and modules…')).toBeInTheDocument();
    expect(screen.getByText('Upload Software')).toBeInTheDocument();
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument();
  });

  it('shows admin destinations to admins', () => {
    useSessionStore.setState({ isLoggedIn: true, isHydrated: true, user: { id: 'u1', role: 'admin' } });
    renderPalette();
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
  });

  it('navigates when an item is selected', () => {
    renderPalette();
    fireEvent.click(screen.getByText('Upload Software'));
    expect(screen.getByTestId('location')).toHaveTextContent('/workspace/upload-software');
    expect(useUiStore.getState().commandPaletteOpen).toBe(false);
  });

  it('opens the help centre for the help action', () => {
    renderPalette();
    fireEvent.click(screen.getByText('Help Centre'));
    expect(useUiStore.getState().helpCentreOpen).toBe(true);
  });
});
