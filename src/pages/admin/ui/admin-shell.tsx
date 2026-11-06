import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../app/router/route-paths';

const links = ['Overview', 'Users', 'Categories', 'System health', 'Logs and events', 'Security'];

export default function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-slate-950 p-4 text-white lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 px-2 py-3">
            <ShieldCheck size={20} className="text-cyan-300" />
            <div><p className="text-sm font-semibold">TechPulse</p><p className="text-xs text-slate-400">Administration</p></div>
          </div>
          <nav aria-label="Admin navigation" className="mt-4 grid gap-1 sm:grid-cols-3 lg:block">
            {links.map((label, index) => (
              <Link key={label} to={ROUTE_PATHS.admin} className={`block rounded-lg px-3 py-2 text-sm transition ${index === 0 && location.pathname === ROUTE_PATHS.admin ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
