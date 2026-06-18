import React, { useEffect, useMemo, useState } from 'react';
import './DashboardLayout.css';

const SIDEBAR_SECTIONS = [
  {
    title: 'Workspace',
    items: [
      { id: 'resources', label: 'Dashboard', icon: 'DB' },
      { id: 'projects', label: 'My Projects', icon: 'MP' },
      { id: 'projects', label: 'Categories', icon: 'CT' },
      { id: 'upload_project', label: 'Upload Project', icon: 'UP' },
    ],
  },
  {
    title: 'Build & Support',
    items: [
      { id: 'developers', label: 'Developers', icon: 'DV' },
      { id: 'api_docs', label: 'Documentation', icon: 'DC' },
      { id: 'support_ai', label: 'AI Assistant', icon: 'AI' },
      { id: 'settings', label: 'Settings', icon: 'ST' },
    ],
  },
];

function formatRole(user) {
  if (!user) return 'Guest';
  const role = String(user.role || 'user').toLowerCase();
  return role === 'admin' ? 'Admin' : 'Member';
}

export default function DashboardLayout({
  user,
  activePage,
  onNavigate,
  onLogout,
  children,
  title,
  subtitle,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const persisted = window.localStorage.getItem('tp-theme');
    if (persisted) return persisted;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const userName = useMemo(() => user?.full_name || user?.username || 'User', [user]);
  const userInitial = useMemo(() => userName.trim().charAt(0).toUpperCase() || 'U', [userName]);
  const adminNav = useMemo(() => {
    if (!user || String(user.role || '').toLowerCase() !== 'admin') return [];
    return [{ id: 'admin', label: 'Admin Console', icon: 'AD' }];
  }, [user]);
  const sidebarSections = useMemo(() => {
    if (!adminNav.length) return SIDEBAR_SECTIONS;
    return [
      ...SIDEBAR_SECTIONS,
      { title: 'Administration', items: adminNav },
    ];
  }, [adminNav]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem('tp-theme', next);
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleNavigate = (target) => {
    onNavigate(target);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className={`tp-dashboard tp-theme-${theme}`}>
      <header className="tp-topbar tp-panel">
        <div className="tp-topbar-left">
          <button
            type="button"
            className="tp-icon-btn"
            aria-label={sidebarOpen ? 'Collapse navigation menu' : 'Expand navigation menu'}
            aria-expanded={sidebarOpen}
            onClick={toggleSidebar}
          >
            <span className="tp-menu-glyph" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="tp-menu-text">{sidebarOpen ? 'Close' : 'Menu'}</span>
          </button>
          <button type="button" className="tp-brand-btn tp-btn tp-btn-primary" onClick={() => onNavigate('resources')}>
            Tech Pulse
          </button>
          <div className="tp-topbar-title" aria-live="polite">
            <strong>{title}</strong>
            {subtitle && <span>{subtitle}</span>}
          </div>
        </div>

        <div className="tp-topbar-right">
          <span className="tp-user-chip" aria-label={`Signed in as ${userName}`}>
            {userName} | {formatRole(user)}
          </span>
          <button
            type="button"
            className="tp-btn tp-btn-secondary"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button type="button" className="tp-btn tp-btn-secondary" onClick={() => onNavigate('support_ai')}>
            AI
          </button>
        </div>
      </header>

      <div className="tp-shell-grid">
        {sidebarOpen && (
          <button
            type="button"
            className="tp-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
        )}

        <aside className={`tp-sidebar ${sidebarOpen ? 'open' : 'closed'} tp-card`} aria-label="Main navigation">
          <header className="tp-sidebar-head tp-card">
            <div className="tp-sidebar-avatar" aria-hidden="true">{userInitial}</div>
            <div className="tp-sidebar-user">
              <strong>{userName}</strong>
              <span>{formatRole(user)} account</span>
            </div>
          </header>

          <div className="tp-sidebar-nav-wrap">
            {sidebarSections.map((section) => (
              <nav key={section.title} className="tp-sidebar-nav" aria-label={section.title}>
                <h3>{section.title}</h3>
                {section.items.map((item) => (
                  <button
                    key={`${item.id}-${item.label}`}
                    type="button"
                    className={`tp-sidebar-link ${activePage === item.id ? 'active' : ''}`}
                    aria-current={activePage === item.id ? 'page' : undefined}
                    onClick={() => handleNavigate(item.id)}
                    title={item.label}
                  >
                    <span className="tp-sidebar-link-icon" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            ))}
          </div>

          <div className="tp-sidebar-footer">
            <button type="button" className="tp-sidebar-link tp-sidebar-logout" onClick={onLogout}>
              <span className="tp-sidebar-link-icon" aria-hidden="true">LO</span>
              Logout
            </button>
          </div>
        </aside>

        <main className="tp-main-content tp-panel" id="tp-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
