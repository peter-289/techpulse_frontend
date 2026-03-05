import React from 'react';

export default function AdminSidebar({
  navItems,
  activeSection,
  setActiveSection,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileNavOpen,
  setMobileNavOpen,
  theme,
  setTheme,
  onBack,
}) {
  return (
    <>
      <aside className={`adm-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'open' : ''}`} aria-label="Sidebar Navigation">
        <div className="adm-sidebar-head">
          <button type="button" className="adm-logo-btn" onClick={() => setActiveSection('overview')}>Software Ops</button>
          <button type="button" className="adm-toggle-btn" onClick={() => setSidebarCollapsed((v) => !v)}>{sidebarCollapsed ? '>' : '<'}</button>
        </div>
        <nav className="adm-nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`adm-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(item.id);
                setMobileNavOpen(false);
              }}
            >
              <span className="adm-nav-bullet" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="adm-sidebar-foot">
          <button type="button" className="adm-plain-btn" onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button type="button" className="adm-plain-btn" onClick={onBack}>Exit Admin</button>
        </div>
      </aside>

      {mobileNavOpen && <button className="adm-overlay" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
    </>
  );
}
