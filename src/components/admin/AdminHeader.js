import React from 'react';
import { toDate } from './adminUtils';

export default function AdminHeader({
  isSuperAdmin,
  unread,
  lastSyncAt,
  search,
  onSearchChange,
  onOpenAlerts,
  onToggleMobileNav,
}) {
  return (
    <header className="adm-header">
      <div>
        <button className="adm-mobile-menu" type="button" onClick={onToggleMobileNav}>Menu</button>
        <h1>Admin Dashboard</h1>
        <div className="adm-header-meta">
          <p>{isSuperAdmin ? 'Super Admin privileges' : 'Admin privileges'}</p>
          <span className={`adm-health ${unread > 0 ? 'warning' : 'healthy'}`}>Workflow: {unread > 0 ? 'Incident Mode' : 'Operational Mode'}</span>
          <small>Last sync: {lastSyncAt ? toDate(lastSyncAt) : 'syncing...'}</small>
        </div>
      </div>
      <div className="adm-header-actions">
        <label htmlFor="admin-search">Global search</label>
        <input id="admin-search" type="search" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search users, software, logs" />
        <button type="button" className="adm-notify-btn" onClick={onOpenAlerts}>Alerts {unread > 0 && <strong>{unread}</strong>}</button>
      </div>
    </header>
  );
}
