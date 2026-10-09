import { Bell, ChevronRight, LogOut, Menu, Moon, Search, Settings, Sun } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, type Ref } from 'react';
import { httpClient as api } from '@/shared/api/http-client';
import { getPageContext } from '@/shared/navigation/workspace-navigation';
import { useSessionStore } from '@/processes/auth/model/session-store';
import { useThemeStore } from '@/shared/store/theme-store';
import { useUiStore } from '@/shared/store/ui-store';

/** Closes on outside pointer input and on Escape. */
function useDismissable(open: boolean, setOpen: (value: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  return ref;
}

function displayName(user: Record<string, unknown> | null): string {
  const value = user?.full_name ?? user?.username ?? user?.name;
  const text = typeof value === 'string' ? value.trim() : '';
  return text || 'Workspace user';
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useDismissable(open, setOpen);

  return (
    <div className="wsp-popover-anchor" ref={ref}>
      <button
        type="button"
        className="wsp-icon-btn"
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
      </button>

      {open && (
        <div className="wsp-popover" role="region" aria-label="Notification Center">
          <p className="wsp-popover-title">Notification Center</p>
          <div className="wsp-empty-state">
            <span className="wsp-empty-state-icon" aria-hidden="true">
              <Bell size={18} />
            </span>
            <p className="wsp-empty-state-title">No new notifications</p>
            <p className="wsp-empty-state-text">
              Notifications will appear here when available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      className="wsp-icon-btn"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useDismissable(open, setOpen);
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clearSession);

  const name = displayName(user);
  const email = typeof user?.email === 'string' ? user.email : '';
  const initial = name.charAt(0).toUpperCase() || 'U';

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      /* session teardown continues even if the API call fails */
    }
    setOpen(false);
    clearSession();
    navigate('/login');
  };

  return (
    <div className="wsp-popover-anchor" ref={ref}>
      <button
        type="button"
        className="wsp-icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-expanded={open}
        title="Account"
      >
        <span className="wsp-avatar lg" aria-hidden="true">
          {initial}
        </span>
      </button>

      {open && (
        <div className="wsp-popover" role="region" aria-label="Account">
          <div className="wsp-menu-header">
            <div className="wsp-menu-header-name">{name}</div>
            {email && <div className="wsp-menu-header-meta">{email}</div>}
          </div>
          <div className="wsp-menu-list">
            <Link className="wsp-menu-item" to="/workspace/settings" onClick={() => setOpen(false)}>
              <Settings size={16} /> Settings
            </Link>
            <button type="button" className="wsp-menu-item danger" onClick={() => void logout()}>
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type Props = {
  onToggleNav: () => void;
  navExpanded: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function WorkspaceHeader({ onToggleNav, navExpanded, ref }: Props) {
  const location = useLocation();
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const { section, title } = getPageContext(location.pathname);

  return (
    <header className="wsp-header">
      <div className="wsp-header-left">
        <button
          ref={ref}
          type="button"
          className="wsp-icon-btn wsp-menu-btn"
          onClick={onToggleNav}
          aria-label={navExpanded ? 'Collapse navigation menu' : 'Open navigation menu'}
          aria-expanded={navExpanded}
          aria-controls="wsp-sidebar"
          title="Toggle navigation"
        >
          <Menu size={19} />
        </button>

        <nav className="wsp-breadcrumb" aria-label="Breadcrumb">
          <span className="wsp-breadcrumb-section">{section}</span>
          <ChevronRight className="wsp-breadcrumb-sep" size={13} aria-hidden="true" />
          <span className="wsp-breadcrumb-title">{title}</span>
        </nav>
      </div>

      <div className="wsp-header-right">
        <button
          type="button"
          className="wsp-search-btn"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <Search size={14} />
          <span>Search</span>
          <kbd>Ctrl K</kbd>
        </button>

        <NotificationBell />
        <ThemeToggle />
        <span className="wsp-header-divider" aria-hidden="true" />
        <UserMenu />
      </div>
    </header>
  );
}
