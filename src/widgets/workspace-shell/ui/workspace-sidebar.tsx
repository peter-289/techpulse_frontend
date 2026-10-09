import { ChevronLeft, ChevronRight, Layers3, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Ref } from 'react';
import { httpClient as api } from '@/shared/api/http-client';
import { appConfig } from '@/shared/config/app-config';
import { cn } from '@/shared/lib/cn';
import {
  isNavItemActive,
  workspaceNavigation,
  type WorkspaceNavItem,
} from '@/shared/navigation/workspace-navigation';
import { useSessionStore } from '@/processes/auth/model/session-store';
import { useUiStore } from '@/shared/store/ui-store';

function displayName(user: Record<string, unknown> | null): string {
  const value = user?.full_name ?? user?.username ?? user?.name;
  const text = typeof value === 'string' ? value.trim() : '';
  return text || 'Workspace user';
}

function displayEmail(user: Record<string, unknown> | null): string {
  const value = user?.email;
  const text = typeof value === 'string' ? value.trim() : '';
  return text || 'Authenticated session';
}

function initial(user: Record<string, unknown> | null): string {
  const value = displayName(user);
  return value.charAt(0).toUpperCase() || 'U';
}

type Props = {
  mobileOpen: boolean;
  onNavigate: () => void;
  ref?: Ref<HTMLElement>;
};

export function WorkspaceSidebar({ mobileOpen, onNavigate, ref }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setHelpCentreOpen = useUiStore((s) => s.setHelpCentreOpen);
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clearSession);

  const isAdmin = String(user?.role ?? '').toLowerCase() === 'admin';

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      /* session teardown continues even if the API call fails */
    }
    clearSession();
    navigate('/login');
  };

  const handleItemClick = (item: WorkspaceNavItem) => {
    if (item.action === 'help') setHelpCentreOpen(true);
    onNavigate();
  };

  const sections = workspaceNavigation
    .filter((section) => section.items.some((item) => !item.adminOnly || isAdmin))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.adminOnly || isAdmin),
    }));

  return (
    <aside
      id="wsp-sidebar"
      ref={ref}
      className={cn('wsp-sidebar', mobileOpen && 'is-open')}
      aria-label="Workspace navigation"
    >
      <div className="wsp-sidebar-head">
        <Link className="wsp-brand" to="/workspace/overview" onClick={onNavigate}>
          <span className="wsp-brand-mark" aria-hidden="true">
            <Layers3 size={17} />
          </span>
          <span className="wsp-brand-name">{appConfig.appName}</span>
        </Link>
        <button
          type="button"
          className="wsp-icon-btn wsp-collapse-btn"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="wsp-sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="wsp-nav" aria-label="Primary">
        {sections.map((section) => (
          <div className="wsp-nav-group" key={section.id}>
            <p className="wsp-nav-heading">{section.title}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item, location.pathname);
              const className = cn('wsp-nav-link', active && 'is-active');

              if (item.action) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={className}
                    onClick={() => handleItemClick(item)}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon />
                    <span className="wsp-nav-label">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.to ?? '/workspace/overview'}
                  className={className}
                  onClick={() => handleItemClick(item)}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon />
                  <span className="wsp-nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="wsp-sidebar-foot">
        <div className="wsp-user-chip">
          <span className="wsp-avatar" aria-hidden="true">
            {initial(user)}
          </span>
          <span className="wsp-user-chip-text">
            <span className="wsp-user-chip-name">{displayName(user)}</span>
            <span className="wsp-user-chip-meta">{displayEmail(user)}</span>
          </span>
        </div>
        <button
          type="button"
          className="wsp-nav-link"
          onClick={() => {
            onNavigate();
            void logout();
          }}
          title="Log out"
        >
          <LogOut />
          <span className="wsp-nav-label">Log out</span>
        </button>
      </div>
    </aside>
  );
}
