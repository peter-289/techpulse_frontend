import React from 'react';
import KpiCards from '../kpi-cards';
import { toDate } from '../admin-utils';

function MiniLine({ points }) {
  const max = Math.max(...points, 1);
  const poly = points
    .map((v, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - ((v / max) * 100)}`)
    .join(' ');
  return (
    <svg className="adm-mini-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={poly} />
    </svg>
  );
}

export default function OverviewSection({ metrics, permissions, series, logs, health, scans }) {
  return (
    <main className="adm-grid">
      <KpiCards metrics={metrics} />
      <article className="adm-panel">
        <h2>Admin Privileges</h2>
        <ul className="adm-list">
          <li>User lifecycle management: {permissions.manageUsers ? 'Enabled' : 'Disabled'}</li>
          <li>Role assignment: {permissions.assignRoles ? 'Enabled' : 'Disabled'}</li>
          <li>Software moderation: {permissions.moderateSoftware ? 'Enabled' : 'Disabled'}</li>
          <li>Audit and security logs: {permissions.viewAuditTrail ? 'Enabled' : 'Disabled'}</li>
          <li>System settings: {permissions.manageSettings ? 'Enabled' : 'Limited'}</li>
        </ul>
      </article>
      <article className="adm-panel adm-wide">
        <div className="adm-section-head"><h2>Visual Analytics</h2><small>Real-time refresh every 60s</small></div>
        <div className="adm-analytics">
          <section><h4>User growth over time</h4><MiniLine points={series.users} /></section>
          <section><h4>Software downloads trend</h4><MiniLine points={series.downloads} /></section>
          <section><h4>Active sessions visualization</h4><MiniLine points={series.sessions} /></section>
          <section><h4>Malware scan results</h4><ul className="adm-list"><li>Successful: {scans?.successful ?? 'Unavailable'}</li><li>Failed: {scans?.failed ?? 'Unavailable'}</li><li>Total: {scans?.total ?? 'Unavailable'}</li></ul></section>
        </div>
      </article>
      <article className="adm-panel adm-wide">
        <h2>System health</h2>
        <div className="adm-list adm-health-grid">
          {Object.entries(health || {}).map(([name, value]) => <div key={name}><strong>{name}</strong>: {value?.status || 'Unavailable'}</div>)}
        </div>
      </article>
      <article className="adm-panel">
        <h2>Recent Activity Feed</h2>
        <ul className="adm-list">
          {logs.slice(0, 4).map((log) => (
            <li key={`feed-${log.id}`}>{log.type} - {toDate(log.time)}</li>
          ))}
        </ul>
      </article>
    </main>
  );
}
