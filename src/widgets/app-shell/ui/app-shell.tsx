import { Bell, ChevronLeft, ChevronRight, Command as CommandIcon, Download, FolderKanban, Gauge, Layers3, LogOut, Search, Settings, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { httpClient as api } from '@/shared/api/http-client';
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
      await api.post('/api/v1/auth/logout');
    } catch {}
    clearSession();
    navigate('/login');
  };

  const isActive = (to: string) => location.pathname === to || (to === '/workspace/softwares' && /^\/workspace\//.test(location.pathname));

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

  return (
    <div className="min-h-screen text-slate-900">
      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-blue-600/10 bg-white/76 backdrop-blur-xl p-4 transition-transform duration-200 lg:static lg:translate-x-0 shadow-[0_18px_42px_rgba(15,23,42,0.06)]',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            collapsed && 'lg:w-20',
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]">
                <Layers3 size={16} />
              </span>
              {!collapsed && (
                <span className="text-sm font-bold tracking-tight text-slate-900">{appConfig.appName}</span>
              )}
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
                    'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-blue-600/10 text-blue-700 ring-1 ring-inset ring-blue-600/15'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900',
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

          <div className="mt-auto space-y-3 border-t border-slate-200 pt-3">
            <div className="flex items-center gap-3 rounded-xl border border-blue-600/10 bg-white/80 px-3 py-2 shadow-sm">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <Sparkles size={14} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name || user?.username || 'Workspace user'}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || 'Authenticated session'}</p>
                </div>
              )}
            </div>
            <button type="button" className="flex w-full items-center gap-3 rounded-xl border border-blue-600/10 bg-white/70 px-3 py-2 text-sm text-slate-600 transition-all duration-200 hover:border-blue-600/20 hover:bg-white hover:text-slate-900" onClick={() => navigate('/workspace/overview')}>
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
          <header className="sticky top-0 z-20 border-b border-blue-600/10 bg-[rgba(248,251,255,0.82)] px-4 py-3 backdrop-blur-xl lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="inline-flex lg:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle mobile navigation">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Layers3 size={15} /> Menu
                  </span>
                </Button>
                <div className="text-sm font-medium capitalize text-slate-500">{location.pathname.replace('/workspace/', '').replace(/\//g, ' / ') || 'overview'}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden max-w-48 truncate text-xs text-slate-500 md:inline">{user?.email || user?.username || 'Workspace'}</span>
                <Button variant="secondary" onClick={() => setCommandPaletteOpen(true)}>
                  <CommandIcon size={14} /> CMD+K
                </Button>
                <Button variant="ghost" aria-label="Notifications">
                  <Bell size={14} />
                </Button>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-61px)] p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
