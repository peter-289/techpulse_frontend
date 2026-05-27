import { Bell, ChevronLeft, ChevronRight, Command as CommandIcon, Layers3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../../shared/ui/button/button';
import { cn } from '../../../shared/lib/cn';
import { useUiStore } from '../../../shared/store/ui-store';
import { appConfig } from '../../../shared/config/app-config';
import { CommandPalette } from '../../../features/command-palette/ui/command-palette';
import type { PropsWithChildren } from 'react';
import { queryClient } from '../../../app/providers/query-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { httpClient } from '../../../shared/api/http-client';

const navItems = [
  { label: 'Overview', to: '/workspace/overview' },
  { label: 'Software Registry', to: '/workspace/software-registry' },
  { label: 'Project Library', to: '/workspace/project-library' },
  { label: 'Resources', to: '/workspace/resources' },
  { label: 'Projects', to: '/workspace/projects' },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[auto,1fr]">
      <aside className={cn('border-r border-slate-800 bg-slate-950/70 p-3', collapsed ? 'w-20' : 'w-72')}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300">
            <Layers3 size={18} />
            {!collapsed && <span className="text-sm font-semibold">{appConfig.appName}</span>}
          </div>
          <Button variant="ghost" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        <nav className="space-y-2" aria-label="Primary">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onMouseEnter={() => prefetchRoute(item.to)}
                onFocus={() => prefetchRoute(item.to)}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  active ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800',
                )}
              >
                {collapsed ? item.label.charAt(0) : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate text-sm text-slate-300">{location.pathname}</div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setCommandPaletteOpen(true)}>
                <CommandIcon size={14} /> CMD+K
              </Button>
              <Button variant="ghost" aria-label="Notifications">
                <Bell size={14} />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
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
