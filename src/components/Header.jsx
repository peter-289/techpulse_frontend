import React, { useState, useCallback } from 'react';
import './Header.css';
import { FEATURES } from '../config';

const navItems = [
  { id: 'resources', label: 'Workspace' },
  { id: 'support_ai', label: 'Support AI' },
  { id: 'projects', label: 'Project Hub' },
  { id: 'api_docs', label: 'API Docs' },
  { id: 'kb', label: 'Knowledge Base' },
  { id: 'support', label: 'Support' },
  { id: 'updates', label: 'Updates' }
];

function Header({ onNavigate, user, onLogout, activePage }) {
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => setOpen((v) => !v), []);

  const handleNavClick = useCallback((e) => {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    onNavigate(id);
    setOpen(false);
  }, [onNavigate]);

  const handleLogo = useCallback(() => onNavigate(user ? 'resources' : 'landing'), [onNavigate, user]);

  return (
    <header className="tp-header" role="banner">
      <div className="tp-header-left">
        <button className="tp-logo" onClick={handleLogo} type="button" aria-label="Go to home">
          <span className="tp-logo-mark" aria-hidden>⚡</span>
          <span className="tp-logo-text">TechPulse</span>
        </button>

        <button
          className="tp-mobile-toggle"
          aria-expanded={open}
          aria-controls="tp-navigation"
          onClick={handleToggle}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <nav id="tp-navigation" className={`tp-nav ${open ? 'open' : ''}`} aria-label="Main navigation">
          {FEATURES.resources && user && navItems.map((item) => (
            <button
              key={item.id}
              data-id={item.id}
              className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
              onClick={handleNavClick}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="tp-header-right">
        {!user && (
          <>
            <button className="tp-btn tp-btn-secondary" onClick={() => onNavigate('login')}>Login</button>
            <button className="tp-btn tp-btn-secondary" onClick={() => onNavigate('register')}>Register</button>
          </>
        )}
        {user && (
          <>
            <span className="tp-user">{user.full_name || user.user_name}</span>
            {FEATURES.admin_tools && String(user.role).toLowerCase() === 'admin' && (
              <button className="tp-btn tp-btn-secondary" onClick={() => onNavigate('admin')}>Admin</button>
            )}
            <button className="tp-btn tp-btn-secondary" onClick={onLogout}>Logout</button>
          </>
        )}
      </div>
    </header>
  );
}

export default React.memo(Header);
