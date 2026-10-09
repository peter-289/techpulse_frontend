import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CommandPalette } from '../../../features/command-palette/ui/command-palette';
import { HelpCentre, HelpFab } from '../../help-centre/ui/help-centre';
import { cn } from '../../../shared/lib/cn';
import { useUiStore } from '../../../shared/store/ui-store';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceSidebar } from './workspace-sidebar';
import './workspace-shell.css';

const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * The one global workspace shell.
 *
 * Every authenticated page renders inside it via a layout route:
 * sidebar + header + main. Pages own content, the shell owns navigation,
 * theme, notifications and account controls.
 */
export function WorkspaceShell() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  );

  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstFocusable = sidebarRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])');
    firstFocusable?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(!useUiStore.getState().commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommandPaletteOpen]);

  const closeMobileNav = () => {
    setMobileOpen(false);
    hamburgerRef.current?.focus();
  };

  const onToggleNav = () => {
    if (isDesktop) {
      useUiStore.getState().toggleSidebar();
    } else {
      setMobileOpen((value) => !value);
    }
  };

  return (
    <div className={cn('wsp-root', collapsed && 'is-collapsed')}>
      <WorkspaceSidebar ref={sidebarRef} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      {mobileOpen && (
        <button
          type="button"
          className="wsp-overlay"
          onClick={closeMobileNav}
          aria-label="Close navigation menu"
        />
      )}

      <div className="wsp-column">
        <WorkspaceHeader
          ref={hamburgerRef}
          onToggleNav={onToggleNav}
          navExpanded={isDesktop ? !collapsed : mobileOpen}
        />
        <main className="wsp-main" id="wsp-main">
          <Outlet />
        </main>
      </div>

      <HelpCentre />
      <HelpFab />
      <CommandPalette />
    </div>
  );
}
