import React, { useEffect, useMemo, useState } from 'react';
import './AdminPage.css';
import { authApi as api } from './API_Wrapper';
import FeedbackMessage from './components/FeedbackMessage';

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'users', label: 'User Management' },
  { id: 'software', label: 'Software Management' },
  { id: 'analytics', label: 'Analytics & Reports' },
  { id: 'logs', label: 'Activity Logs' },
  { id: 'notifications', label: 'Notifications & Alerts' },
  { id: 'settings', label: 'System Settings' },
  { id: 'profile', label: 'Admin Profile' },
];

const USER_PAGE_SIZE = 8;
const SOFTWARE_PAGE_SIZE = 8;
const LOG_PAGE_SIZE = 10;

const METRIC_SERIES = {
  users: [8, 10, 11, 13, 15, 16, 20, 21, 23, 24, 28, 31],
  downloads: [230, 240, 260, 300, 340, 360, 390, 420, 460, 490, 515, 552],
  sessions: [90, 110, 115, 120, 140, 130, 150, 162, 158, 169, 172, 188],
};

const SAMPLE_USERS = [
  { id: 2001, name: 'Ava Reynolds', email: 'ava@platform.io', role: 'Admin', status: 'Active', lastActive: '2026-03-03T09:00:00Z', registered: '2025-07-18T09:00:00Z' },
  { id: 2002, name: 'Noah Kim', email: 'noah@platform.io', role: 'Moderator', status: 'Active', lastActive: '2026-03-03T08:20:00Z', registered: '2025-08-12T09:00:00Z' },
  { id: 2003, name: 'Liam Stone', email: 'liam@vendor.dev', role: 'Developer', status: 'Suspended', lastActive: '2026-03-02T21:00:00Z', registered: '2026-02-16T09:00:00Z' },
  { id: 2004, name: 'Mia Patel', email: 'mia@vendor.dev', role: 'Developer', status: 'Active', lastActive: '2026-03-03T06:40:00Z', registered: '2025-12-05T09:00:00Z' },
];

const SAMPLE_SOFTWARE = [
  { id: 'PKG-301', name: 'Core Runtime', version: '2.0.1', owner: 'Ava Reynolds', uploadDate: '2026-03-01T09:00:00Z', status: 'Approved', downloads: 1430 },
  { id: 'PKG-302', name: 'Secure Agent', version: '1.4.8', owner: 'Noah Kim', uploadDate: '2026-03-03T07:10:00Z', status: 'Pending', downloads: 221 },
  { id: 'PKG-303', name: 'Bridge Plugin', version: '0.9.1', owner: 'Liam Stone', uploadDate: '2026-02-24T09:00:00Z', status: 'Flagged', downloads: 560 },
];

const SAMPLE_LOGS = [
  { id: 'L1', type: 'Authentication event', actor: 'System', details: 'Failed login attempts from unknown IP', severity: 'Critical', time: '2026-03-03T07:13:00Z' },
  { id: 'L2', type: 'Admin action', actor: 'Ava Reynolds', details: 'Suspended user Liam Stone', severity: 'Warning', time: '2026-03-03T07:25:00Z' },
  { id: 'L3', type: 'Upload event', actor: 'Noah Kim', details: 'Submitted Secure Agent v1.4.8', severity: 'Info', time: '2026-03-03T07:30:00Z' },
];

const SAMPLE_NOTIFICATIONS = [
  { id: 'N1', title: 'High risk login', message: 'Authentication anomaly detected', severity: 'Critical', unread: true, time: '2026-03-03T07:13:00Z' },
  { id: 'N2', title: 'Package review pending', message: 'Secure Agent awaiting approval', severity: 'Warning', unread: true, time: '2026-03-03T07:30:00Z' },
  { id: 'N3', title: 'Analytics digest ready', message: 'Reports are available for export', severity: 'Info', unread: false, time: '2026-03-03T06:00:00Z' },
];

const toDate = (value) => new Date(value).toLocaleString();
const dayKey = (value) => new Date(value).toISOString().slice(0, 10);
const lastNDays = (n) => Array.from({ length: n }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1 - i));
  return dayKey(d);
});

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const tone = (value) => {
  const v = String(value).toLowerCase();
  if (v.includes('critical') || v.includes('flagged') || v.includes('suspended') || v.includes('rejected')) return 'danger';
  if (v.includes('warning') || v.includes('pending')) return 'warning';
  if (v.includes('active') || v.includes('approved') || v.includes('healthy')) return 'success';
  return 'info';
};

function Pill({ value }) {
  return <span className={`adm-pill ${tone(value)}`}>{value}</span>;
}

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

export default function AdminPage({ user, onBack, onNavigate }) {
  const [theme, setTheme] = useState(() => window.localStorage.getItem('adm-theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [software, setSoftware] = useState(SAMPLE_SOFTWARE);
  const [logs, setLogs] = useState(SAMPLE_LOGS);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(METRIC_SERIES);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStatus, setUserStatus] = useState('all');
  const [userRole, setUserRole] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [softwarePage, setSoftwarePage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  useEffect(() => {
    window.localStorage.setItem('adm-theme', theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [u, p, s, a, ev] = await Promise.all([
          api.get('/api/v1/users', { params: { limit: 30 } }),
          api.get('/api/v1/software-management/admin/packages', { params: { limit: 30 } }),
          api.get('/api/v1/software-management/admin/summary'),
          api.get('/api/v1/admin/alerts', { params: { only_unacknowledged: false, limit: 100 } }),
          api.get('/api/v1/admin/audit-events', { params: { limit: 400 } }),
        ]);
        if (!mounted) return;
        if (Array.isArray(u.data) && u.data.length) {
          setUsers(u.data.map((x) => ({
            id: x.id,
            name: x.full_name || x.username || `User ${x.id}`,
            email: x.email || 'N/A',
            role: x.role || 'Viewer',
            status: 'Active',
            lastActive: x.updated_at || x.created_at || new Date().toISOString(),
            registered: x.created_at || new Date().toISOString(),
          })));
        }
        if (Array.isArray(p.data) && p.data.length) {
          setSoftware(p.data.map((x) => ({
            id: x.package_id || x.id,
            name: x.name || 'Package',
            version: x.latest_version || 'N/A',
            owner: x.owner_id || 'Unknown',
            uploadDate: x.created_at || x.updated_at || new Date().toISOString(),
            status: x.is_public ? 'Approved' : 'Pending',
            downloads: Number(x.download_count || 0),
          })));
        }
        if (s.data) setSummary(s.data);

        const alertRows = a.data?.items || [];
        if (alertRows.length) {
          setNotifications(alertRows.map((item) => ({
            id: item.id,
            apiId: item.id,
            title: item.title || 'Alert',
            message: item.description || 'Alert details unavailable.',
            severity: String(item.severity || 'Info'),
            unread: !item.acknowledged,
            time: item.created_at || new Date().toISOString(),
          })));
        }

        const eventRows = ev.data?.items || [];
        if (eventRows.length) {
          setLogs(eventRows.map((item) => ({
            id: item.id,
            type: item.event_type || 'Audit event',
            actor: item.actor_username || item.actor_user_id || 'System',
            details: `${item.method || ''} ${item.path || ''}`.trim() || 'Event details unavailable.',
            severity: item.success ? 'Info' : 'Warning',
            time: item.occurred_at || new Date().toISOString(),
          })));
        }

        const days = lastNDays(12);
        const usersDaily = days.map((day) => (Array.isArray(u.data) ? u.data.filter((row) => row.created_at && dayKey(row.created_at) === day).length : 0));
        const downloadDaily = days.map((day) => eventRows.filter((row) => row.occurred_at && dayKey(row.occurred_at) === day && String(row.path || '').includes('/download')).length);
        const sessionsDaily = days.map((day) => {
          const unique = new Set(
            eventRows
              .filter((row) => row.occurred_at && dayKey(row.occurred_at) === day && row.actor_user_id)
              .map((row) => row.actor_user_id),
          );
          return unique.size;
        });
        setSeries({
          users: usersDaily.some(Boolean) ? usersDaily : METRIC_SERIES.users,
          downloads: downloadDaily.some(Boolean) ? downloadDaily : METRIC_SERIES.downloads,
          sessions: sessionsDaily.some(Boolean) ? sessionsDaily : METRIC_SERIES.sessions,
        });
      } catch {
        setFeedback({ variant: 'warning', title: 'Offline sample mode', message: 'Live admin APIs unavailable. Showing local dataset.' });
      } finally {
        if (mounted) {
          setLoading(false);
          setLastSyncAt(new Date().toISOString());
        }
      }
    }
    load();
    const timer = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const usersFiltered = useMemo(
    () => users.filter((u) => {
      const text = `${u.id} ${u.name} ${u.email} ${u.role}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (userStatus !== 'all' && u.status.toLowerCase() !== userStatus) return false;
      if (userRole !== 'all' && u.role.toLowerCase() !== userRole) return false;
      return true;
    }),
    [users, search, userStatus, userRole],
  );

  const softwareFiltered = useMemo(
    () => software.filter((s) => (`${s.id} ${s.name} ${s.owner}`.toLowerCase().includes(search.toLowerCase()))),
    [software, search],
  );

  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const isSuperAdmin = String(user?.account_type || '').toLowerCase() === 'super_admin';
  const permissions = useMemo(() => ({
    manageUsers: isAdmin,
    suspendAccounts: isAdmin,
    assignRoles: isAdmin,
    moderateSoftware: isAdmin,
    exportReports: isAdmin,
    viewAuditTrail: isAdmin,
    manageAlerts: isAdmin,
    manageSettings: isAdmin && isSuperAdmin,
    destructiveActions: isSuperAdmin,
  }), [isAdmin, isSuperAdmin]);

  const userTotalPages = Math.max(1, Math.ceil(usersFiltered.length / USER_PAGE_SIZE));
  const softwareTotalPages = Math.max(1, Math.ceil(softwareFiltered.length / SOFTWARE_PAGE_SIZE));
  const logTotalPages = Math.max(1, Math.ceil(logs.length / LOG_PAGE_SIZE));
  const usersPageRows = usersFiltered.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE);
  const softwarePageRows = softwareFiltered.slice((softwarePage - 1) * SOFTWARE_PAGE_SIZE, softwarePage * SOFTWARE_PAGE_SIZE);
  const logsPageRows = logs.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);

  const unread = notifications.filter((n) => n.unread).length;
  const formatMetricValue = (value) => (typeof value === 'number' ? value.toLocaleString() : value);
  const trendFromSeries = (arr) => {
    if (!Array.isArray(arr) || arr.length < 2) return null;
    const first = Number(arr[0] || 0);
    const last = Number(arr[arr.length - 1] || 0);
    if (!first && !last) return null;
    const delta = last - first;
    const pct = first === 0 ? null : Math.round((delta / first) * 100);
    if (delta === 0) return { dir: 'flat', text: 'No change' };
    if (pct == null) return { dir: delta > 0 ? 'up' : 'down', text: `${delta > 0 ? '+' : ''}${delta}` };
    return { dir: delta > 0 ? 'up' : 'down', text: `${delta > 0 ? '+' : ''}${pct}%` };
  };
  const metrics = [
    { label: 'Total Users', value: summary?.total_users ?? users.length, series: series.users },
    { label: 'Active Users', value: summary?.active_users ?? users.filter((u) => u.status === 'Active').length, series: series.sessions },
    { label: 'Uploaded Software Packages', value: summary?.total_packages ?? software.length, series: series.users.slice(2) },
    { label: 'Downloads Today', value: summary?.downloads_today ?? software.reduce((sum, s) => sum + s.downloads, 0), series: series.downloads },
    { label: 'System Health Status', value: unread > 0 ? 'Warning' : 'Healthy', series: series.sessions.slice(1) },
    { label: 'Pending Reviews / Flags', value: summary?.pending_reviews ?? software.filter((s) => ['Pending', 'Flagged'].includes(s.status)).length, series: series.users.slice(3) },
  ];

  const updateUser = (id, status) => {
    if (!permissions.suspendAccounts) {
      setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to update account status.' });
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const assignUserRole = (id, role) => {
    if (!permissions.assignRoles) {
      setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to assign roles.' });
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const updateSoftware = (id, status) => {
    if (!permissions.moderateSoftware) {
      setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to moderate software.' });
      return;
    }
    setSoftware((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };
  const topSoftware = useMemo(
    () => software.slice().sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    [software],
  );

  useEffect(() => {
    setUserPage(1);
    setSoftwarePage(1);
    setLogPage(1);
  }, [search, userStatus, userRole]);

  const exportCsv = () => {
    if (!permissions.exportReports) {
      setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to export reports.' });
      return;
    }
    const metricRows = metrics.map((metric) => `${metric.label},${String(metric.value).replace(/,/g, '')}`);
    const topRows = topSoftware.map((item) => `${item.name},${item.version},${item.owner},${item.downloads}`);
    const csv = [
      `Admin Analytics Report (${dateRange})`,
      '',
      'Metric,Value',
      ...metricRows,
      '',
      'Top Software,Version,Owner,Downloads',
      ...topRows,
      '',
      'Daily Series (latest 12 days)',
      `Users,${series.users.join(',')}`,
      `Downloads,${series.downloads.join(',')}`,
      `Sessions,${series.sessions.join(',')}`,
    ].join('\n');
    downloadBlob(`admin-analytics-${dateRange}.csv`, csv, 'text/csv;charset=utf-8');
    setFeedback({ variant: 'success', title: 'CSV exported', message: `Downloaded admin-analytics-${dateRange}.csv` });
  };

  const exportPdf = () => {
    if (!permissions.exportReports) {
      setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to export reports.' });
      return;
    }
    const rows = topSoftware.map((item) => `<tr><td>${item.name}</td><td>${item.version}</td><td>${item.owner}</td><td>${item.downloads}</td></tr>`).join('');
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
    if (!popup) {
      setFeedback({ variant: 'error', title: 'Popup blocked', message: 'Allow popups to export PDF.' });
      return;
    }
    popup.document.write(`
      <html>
        <head>
          <title>Admin Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #15202b; }
            h1 { margin: 0 0 4px; } p { margin: 0 0 16px; color: #556677; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px; }
            th, td { border: 1px solid #dbe3ea; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f3f6f9; }
          </style>
        </head>
        <body>
          <h1>Admin Analytics Report</h1>
          <p>Date range: ${dateRange}</p>
          <table>
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>${metrics.map((m) => `<tr><td>${m.label}</td><td>${m.value}</td></tr>`).join('')}</tbody>
          </table>
          <h2>Most Downloaded Software</h2>
          <table>
            <thead><tr><th>Name</th><th>Version</th><th>Owner</th><th>Downloads</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
    setFeedback({ variant: 'success', title: 'PDF export opened', message: 'Use the print dialog to save as PDF.' });
  };

  if (!isAdmin) {
    return (
      <div className={`adm-root adm-theme-${theme}`}>
        <div className="adm-content-wrap">
          <section className="adm-panel">
            <h2>Admin Access Required</h2>
            <p>This dashboard is restricted to administrator accounts.</p>
            <div className="adm-actions">
              <button type="button" onClick={() => (onNavigate ? onNavigate('resources') : onBack())}>Back to Workspace</button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={`adm-root adm-theme-${theme}`}>
      <a className="adm-skip" href="#adm-main">Skip to content</a>
      <div className="adm-shell">
        <aside className={`adm-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'open' : ''}`} aria-label="Sidebar Navigation">
          <div className="adm-sidebar-head">
            <button type="button" className="adm-logo-btn" onClick={() => setActiveSection('overview')}>Software Ops</button>
            <button type="button" className="adm-toggle-btn" onClick={() => setSidebarCollapsed((v) => !v)}>{sidebarCollapsed ? '>' : '<'}</button>
          </div>
          <nav className="adm-nav-list">
            {NAV_ITEMS.map((item) => (
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

        <div className="adm-content-wrap" id="adm-main">
          <header className="adm-header">
            <div>
              <button className="adm-mobile-menu" type="button" onClick={() => setMobileNavOpen((v) => !v)}>Menu</button>
              <h1>Admin Dashboard</h1>
              <div className="adm-header-meta">
                <p>{isSuperAdmin ? 'Super Admin privileges' : 'Admin privileges'}</p>
                <span className={`adm-health ${unread > 0 ? 'warning' : 'healthy'}`}>Workflow: {unread > 0 ? 'Incident Mode' : 'Operational Mode'}</span>
                <small>Last sync: {lastSyncAt ? toDate(lastSyncAt) : 'syncing...'}</small>
              </div>
            </div>
            <div className="adm-header-actions">
              <label htmlFor="admin-search">Global search</label>
              <input id="admin-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users, software, logs" />
              <button type="button" className="adm-notify-btn" onClick={() => setActiveSection('notifications')}>Alerts {unread > 0 && <strong>{unread}</strong>}</button>
            </div>
          </header>

          {feedback && <FeedbackMessage {...feedback} onClose={() => setFeedback(null)} />}
          {loading && <FeedbackMessage variant="info" title="Loading dashboard" message="Fetching modules..." />}

          {!loading && activeSection === 'overview' && (
            <main className="adm-grid">
              {metrics.map((m) => {
                const trend = trendFromSeries(m.series);
                return (
                  <article key={m.label} className="adm-panel">
                    <p className="adm-kpi-label">{m.label}</p>
                    <h3 className="adm-kpi-value">{formatMetricValue(m.value)}</h3>
                    {trend && (
                      <small className={`adm-kpi-trend ${trend.dir}`}>
                        {trend.dir === 'up' ? 'Up' : trend.dir === 'down' ? 'Down' : 'Flat'} {trend.text} vs baseline
                      </small>
                    )}
                    <MiniLine points={m.series} />
                  </article>
                );
              })}
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
                  <section><h4>System usage distribution</h4><ul className="adm-list"><li>Admin: 26%</li><li>Developer: 48%</li><li>Viewer: 26%</li></ul></section>
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
          )}

          {!loading && activeSection === 'users' && (
            <section className="adm-panel">
              <div className="adm-section-head"><h2>User Management</h2></div>
              <div className="adm-filters">
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                  <option value="all">Role: all</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="developer">Developer</option><option value="viewer">Viewer</option>
                </select>
                <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)}>
                  <option value="all">Status: all</option><option value="active">Active</option><option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th>Actions</th></tr></thead>
                  <tbody>
                    {usersPageRows.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td><Pill value={u.status} /></td><td>{toDate(u.lastActive)}</td>
                        <td>
                          <div className="adm-actions">
                            <button type="button" onClick={() => setSelectedUser(u)}>View</button>
                            <button type="button" onClick={() => setFeedback({ variant: 'info', title: 'Notification sent', message: `Warning sent to ${u.email}.` })}>Warn</button>
                            <select
                              value={u.role}
                              aria-label={`Assign role for ${u.name}`}
                              onChange={(e) => assignUserRole(u.id, e.target.value)}
                            >
                              <option value="Admin">Admin</option>
                              <option value="Moderator">Moderator</option>
                              <option value="Developer">Developer</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                            {u.status === 'Suspended'
                              ? <button type="button" onClick={() => updateUser(u.id, 'Active')}>Activate</button>
                              : <button type="button" onClick={() => setConfirm({ title: 'Suspend account', message: `Suspend ${u.name}?`, action: () => updateUser(u.id, 'Suspended') })}>Suspend</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="adm-pagination">
                {Array.from({ length: userTotalPages }).map((_, index) => (
                  <button
                    key={`u-page-${index + 1}`}
                    type="button"
                    className={userPage === index + 1 ? 'active' : ''}
                    onClick={() => setUserPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              {selectedUser && <div className="adm-detail"><h3>{selectedUser.name}</h3><p>{selectedUser.email}</p><p>Login and activity history available for audit.</p><button type="button" onClick={() => setSelectedUser(null)}>Close</button></div>}
            </section>
          )}

          {!loading && activeSection === 'software' && (
            <section className="adm-panel">
              <div className="adm-section-head"><h2>Software Management</h2></div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Software Name</th><th>Version</th><th>Owner</th><th>Upload Date</th><th>Status</th><th>Downloads</th><th>Actions</th></tr></thead>
                  <tbody>
                    {softwarePageRows.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td><td>{s.version}</td><td>{s.owner}</td><td>{toDate(s.uploadDate)}</td><td><Pill value={s.status} /></td><td>{s.downloads}</td>
                        <td>
                          <div className="adm-actions">
                            <button type="button" onClick={() => updateSoftware(s.id, 'Approved')}>Approve</button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!permissions.destructiveActions) {
                                  setFeedback({ variant: 'warning', title: 'Limited privilege', message: 'Reject/Archive actions require super admin privilege.' });
                                  return;
                                }
                                setConfirm({ title: 'Reject package', message: `Reject ${s.name}?`, action: () => updateSoftware(s.id, 'Rejected') });
                              }}
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!permissions.destructiveActions) {
                                  setFeedback({ variant: 'warning', title: 'Limited privilege', message: 'Reject/Archive actions require super admin privilege.' });
                                  return;
                                }
                                updateSoftware(s.id, 'Archived');
                              }}
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="adm-pagination">
                {Array.from({ length: softwareTotalPages }).map((_, index) => (
                  <button
                    key={`s-page-${index + 1}`}
                    type="button"
                    className={softwarePage === index + 1 ? 'active' : ''}
                    onClick={() => setSoftwarePage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!loading && activeSection === 'analytics' && (
            <section className="adm-panel">
              <div className="adm-section-head">
                <h2>Analytics & Reporting</h2>
                <div className="adm-actions">
                  <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option></select>
                  <button type="button" onClick={exportCsv}>Export CSV</button>
                  <button type="button" onClick={exportPdf}>Export PDF</button>
                </div>
              </div>
              <div className="adm-analytics">
                <section><h4>User growth analytics</h4><MiniLine points={series.users} /></section>
                <section><h4>Download trends</h4><MiniLine points={series.downloads} /></section>
                <section><h4>Platform engagement</h4><MiniLine points={series.sessions} /></section>
                <section><h4>Most downloaded software</h4><ul className="adm-list">{topSoftware.map((x) => <li key={x.id}>{x.name}: {x.downloads}</li>)}</ul></section>
              </div>
            </section>
          )}

          {!loading && activeSection === 'logs' && (
            <section className="adm-panel">
              <div className="adm-section-head"><h2>Activity Logs & Security</h2></div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Timestamp</th><th>Type</th><th>Actor</th><th>Details</th><th>Severity</th></tr></thead>
                  <tbody>{logsPageRows.map((l) => <tr key={l.id}><td>{toDate(l.time)}</td><td>{l.type}</td><td>{l.actor}</td><td>{l.details}</td><td><Pill value={l.severity} /></td></tr>)}</tbody>
                </table>
              </div>
              <div className="adm-pagination">
                {Array.from({ length: logTotalPages }).map((_, index) => (
                  <button
                    key={`l-page-${index + 1}`}
                    type="button"
                    className={logPage === index + 1 ? 'active' : ''}
                    onClick={() => setLogPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!loading && activeSection === 'notifications' && (
            <section className="adm-panel">
              <div className="adm-section-head"><h2>Notifications & Alerts</h2></div>
              <ul className="adm-notifications">
                {notifications.map((n) => (
                  <li key={n.id} className={n.unread ? 'unread' : ''}>
                    <div><strong>{n.title}</strong><p>{n.message}</p><small>{toDate(n.time)}</small></div>
                    <div className="adm-actions">
                      <Pill value={n.severity} />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!permissions.manageAlerts) {
                            setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to manage alerts.' });
                            return;
                          }
                          try {
                            if (n.apiId) await api.patch(`/api/v1/admin/alerts/${n.apiId}/ack`);
                          } catch {
                            // Keep optimistic UI behavior even if acknowledgement fails.
                          }
                          setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
                        }}
                      >
                        Mark read
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading && activeSection === 'settings' && (
            <section className="adm-panel">
              <h2>System Settings</h2>
              {!permissions.manageSettings && (
                <FeedbackMessage
                  variant="warning"
                  title="Limited settings access"
                  message="Only super admins can modify global system settings."
                  compact
                />
              )}
              <div className="adm-filters">
                <label>
                  Approval workflow
                  <select disabled={!permissions.manageSettings}>
                    <option>Strict</option>
                    <option>Balanced</option>
                  </select>
                </label>
                <label>
                  Session timeout
                  <select disabled={!permissions.manageSettings}>
                    <option>30m</option>
                    <option>60m</option>
                  </select>
                </label>
                <label>
                  Security threshold
                  <select disabled={!permissions.manageSettings}>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>
              </div>
            </section>
          )}

          {!loading && activeSection === 'profile' && (
            <section className="adm-panel">
              <h2>Admin Profile</h2>
              <p>Name: {user?.full_name || user?.username || 'Administrator'}</p>
              <p>Role: {isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
              <p>Permissions: User management, software lifecycle control, analytics exports, security response.</p>
            </section>
          )}
        </div>
      </div>

      {confirm && (
        <div className="adm-modal">
          <div className="adm-modal-card">
            <h3>{confirm.title}</h3>
            <p>{confirm.message}</p>
            <div className="adm-actions"><button type="button" onClick={() => setConfirm(null)}>Cancel</button><button type="button" onClick={() => { confirm.action(); setConfirm(null); }}>Confirm</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
