import { Bell, ChevronLeft, ChevronRight, Command as CommandIcon, Download, FolderKanban, Gauge, Layers3, LogOut, Search, Settings, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { authApi } from '../../../API_Wrapper';
import { CommandPalette } from '../../../features/command-palette/ui/command-palette';
import { useSessionStore } from '../../../processes/auth/model/session-store';
import { cn } from '../../../shared/lib/cn';
import { appConfig } from '../../../shared/config/app-config';
import { Button } from '../../../shared/ui/button/button';
import { useUiStore } from '../../../shared/store/ui-store';

const navItems = [
  { label: 'Dashboard', to: '/workspace/overview', icon: Gauge },
  { label: 'My Software', to: '/workspace/softwares', icon: FolderKanban },
  { label: 'Discover', to: '/workspace/discover', icon: Search },
  { label: 'Downloads', to: '/workspace/softwares', icon: Download },
];

export function AppShell({ children }: PropsWithChildren) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const user = useSessionStore((s) => s.user) as { email?: string; username?: string; name?: string } | null;
  const clearSession = useSessionStore((s) => s.clearSession);

  const logout = async () => {
    try {
      await authApi.post('/api/v1/auth/logout');
    } catch {}
    clearSession();
    navigate('/login');
  };

  const isActive = (to: string) => location.pathname === to || (to === '/workspace/softwares' && /^\/workspace\//.test(location.pathname));

  return (
    <div className="min-h-screen bg-neutral-950 text-stone-100">
      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-stone-800 bg-neutral-950/95 p-3 transition-transform duration-200 lg:static lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            collapsed && 'lg:w-20',
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-300">
              <Layers3 size={18} />
              {!collapsed && <span className="text-sm font-semibold tracking-[0.16em] text-stone-100">{appConfig.appName}</span>}
            </div>
            <Button variant="ghost" className="hidden lg:inline-flex" onClick={toggleSidebar} aria-label="Toggle sidebar">
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>

          <nav className="space-y-2" aria-label="Sidebar navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                    active ? 'border-teal-500/40 bg-teal-500/10 text-teal-100' : 'border-transparent text-stone-400 hover:border-stone-800 hover:bg-stone-900 hover:text-stone-100',
                    collapsed && 'lg:justify-center',
                  )}
                  title={item.label}
                >
                  <Icon size={16} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 border-t border-stone-800 pt-3">
            <div className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-900/60 px-3 py-2 text-sm text-stone-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
                <Sparkles size={14} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-100">{user?.name || user?.username || 'Workspace user'}</p>
                  <p className="truncate text-xs text-stone-400">{user?.email || 'Authenticated session'}</p>
                </div>
              )}
            </div>
            <button type="button" className="flex w-full items-center gap-3 rounded-xl border border-stone-800 bg-stone-900/40 px-3 py-2 text-sm text-stone-300 transition-colors hover:border-stone-700 hover:bg-stone-900" onClick={() => navigate('/workspace/overview')}>
              <Settings size={15} />
              {!collapsed && <span>Settings</span>}
            </button>
            <Button className="w-full justify-start" variant="ghost" onClick={logout}>
              <LogOut size={15} />
              {!collapsed && <span>Log out</span>}
            </Button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-stone-800 bg-neutral-950/90 px-4 py-3 backdrop-blur-sm lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="inline-flex lg:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle mobile navigation">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Layers3 size={15} /> Menu
                  </span>
                </Button>
                <div className="text-sm text-stone-400">{location.pathname.replace('/workspace/', '').replace(/\//g, ' / ') || 'overview'}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden max-w-48 truncate text-xs text-stone-500 md:inline">{user?.email || user?.username || 'Workspace'}</span>
                <Button variant="secondary" onClick={() => setCommandPaletteOpen(true)}>
                  <CommandIcon size={14} /> CMD+K
                </Button>
                <Button variant="ghost" aria-label="Notifications">
                  <Bell size={14} />
                </Button>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-61px)] bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_30%),linear-gradient(180deg,rgba(12,12,12,0.96),rgba(12,12,12,1))] p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
