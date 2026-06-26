import { Bell, ChevronLeft, ChevronRight, Command as CommandIcon, FolderKanban, Gauge, Layers3, Library, LogOut, ShieldCheck, UploadCloud } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/button/button';
import { cn } from '../../../shared/lib/cn';
import { useUiStore } from '../../../shared/store/ui-store';
import { appConfig } from '../../../shared/config/app-config';
import { CommandPalette } from '../../../features/command-palette/ui/command-palette';
import type { PropsWithChildren } from 'react';
import { queryClient } from '../../../app/providers/query-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { httpClient } from '../../../shared/api/http-client';
import { authApi } from '../../../API_Wrapper';
import { useSessionStore } from '../../../processes/auth/model/session-store';

const navItems = [
  { label: 'Overview', to: '/workspace/overview', icon: Gauge },
  { label: 'Software Registry', to: '/workspace/software-registry', icon: Layers3 },
  { label: 'Project Library', to: '/workspace/project-library', icon: Library },
  { label: 'Upload Project', to: '/workspace/upload-project', icon: UploadCloud },
  { label: 'Admin', to: '/workspace/admin', icon: ShieldCheck },
  { label: 'Projects', to: '/workspace/projects', icon: FolderKanban },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const user = useSessionStore((s) => s.user) as any;
  const clearSession = useSessionStore((s) => s.clearSession);

  const logout = async () => {
    try {
      await authApi.post('/api/v1/auth/logout');
    } catch {}
    clearSession();
    navigate('/login');
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-neutral-950 text-stone-100 md:grid-cols-[auto,1fr]">
      <aside className={cn('border-r border-stone-800 bg-neutral-950 p-3', collapsed ? 'w-20' : 'w-72')}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-300">
            <Layers3 size={18} />
            {!collapsed && <span className="text-sm font-semibold tracking-wide text-stone-100">{appConfig.appName}</span>}
          </div>
          <Button variant="ghost" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        <nav className="space-y-2" aria-label="Primary">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onMouseEnter={() => prefetchRoute(item.to)}
                onFocus={() => prefetchRoute(item.to)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  active
                    ? 'border-teal-500/40 bg-teal-500/15 text-teal-100'
                    : 'border-transparent text-stone-400 hover:border-stone-800 hover:bg-stone-900 hover:text-stone-100',
                )}
                title={item.label}
              >
                <Icon size={16} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-stone-800 pt-3">
          <Button className="w-full justify-start" variant="ghost" onClick={logout} title="Log out">
            <LogOut size={16} />
            {!collapsed && <span>Log out</span>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-stone-800 bg-neutral-950/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate text-sm text-stone-400">{location.pathname}</div>
            <div className="flex items-center gap-2">
              <span className="hidden max-w-48 truncate text-xs text-stone-500 md:inline">
                {user?.email || user?.username || user?.name || 'Workspace'}
              </span>
              <Button variant="secondary" onClick={() => setCommandPaletteOpen(true)}>
                <CommandIcon size={14} /> CMD+K
              </Button>
              <Button variant="ghost" aria-label="Notifications">
                <Bell size={14} />
              </Button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-57px)] bg-[linear-gradient(180deg,rgba(41,37,36,0.52),rgba(10,10,10,0.96))] p-4 md:p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
  const prefetchRoute = (to: string) => {
    if (to === '/workspace/software-registry' || to === '/workspace/project-library') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.software.list(120),
        queryFn: async () => {
          const response = await httpClient.get('/api/v1/software-management', { params: { limit: 120 } });
          return Array.isArray(response.data) ? response.data : [];
        },
      }).catch(() => {});
    }
    if (to === '/workspace/admin') {
      import('../../../pages/admin-workspace/ui/admin-workspace-page').catch(() => {});
    }
    if (to === '/workspace/upload-project') {
      import('../../../pages/upload-workspace/ui/upload-workspace-page').catch(() => {});
    }
  };
