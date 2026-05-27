import React, { useEffect, useMemo, useState } from 'react';
import './AdminPage.css';
import FeedbackMessage from './components/FeedbackMessage';
import { Pill } from './components/admin/adminUtils';
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHeader from './components/admin/AdminHeader';
import SkeletonDashboard from './components/admin/SkeletonDashboard';
import OverviewSection from './components/admin/sections/OverviewSection';
import UsersSection from './components/admin/sections/UsersSection';
import SoftwareSection from './components/admin/sections/SoftwareSection';
import LogsSection from './components/admin/sections/LogsSection';
import AnalyticsSection from './components/admin/sections/AnalyticsSection';
import useDebounce from './hooks/useDebounce';
import useAdminData from './hooks/useAdminData';

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

export default function AdminPage({ user, onBack, onNavigate }) {
  const [theme, setTheme] = useState(() => window.localStorage.getItem('adm-theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [searchInput, setSearchInput] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStatus, setUserStatus] = useState('all');
  const [userRole, setUserRole] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [softwarePage, setSoftwarePage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedSoftwareIds, setSelectedSoftwareIds] = useState(new Set());
  const [userBulkAction, setUserBulkAction] = useState('');
  const [softwareBulkAction, setSoftwareBulkAction] = useState('');

  const search = useDebounce(searchInput, 320);

  const {
    loading,
    feedback,
    users,
    software,
    logs,
    notifications,
    summary,
    series,
    lastSyncAt,
    setFeedback,
    updateUserStatus,
    assignUserRole,
    updateSoftwareStatus,
    markNotificationRead,
  } = useAdminData();

  useEffect(() => {
    window.localStorage.setItem('adm-theme', theme);
  }, [theme]);

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
  const metrics = [
    { label: 'Total Users', value: summary?.total_users ?? users.length, series: series.users },
    { label: 'Active Users', value: summary?.active_users ?? users.filter((u) => u.status === 'Active').length, series: series.sessions },
    { label: 'Uploaded Software Packages', value: summary?.total_packages ?? software.length, series: series.users.slice(2) },
    { label: 'Downloads Today', value: summary?.downloads_today ?? software.reduce((sum, s) => sum + s.downloads, 0), series: series.downloads },
    { label: 'System Health Status', value: unread > 0 ? 'Warning' : 'Healthy', series: series.sessions.slice(1) },
    { label: 'Pending Reviews / Flags', value: summary?.pending_reviews ?? software.filter((s) => ['Pending', 'Flagged'].includes(s.status)).length, series: series.users.slice(3) },
  ];
  const topSoftware = useMemo(
    () => software.slice().sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    [software],
  );

  useEffect(() => {
    setUserPage(1);
    setSoftwarePage(1);
    setLogPage(1);
    setSelectedUserIds(new Set());
    setSelectedSoftwareIds(new Set());
  }, [search, userStatus, userRole]);

  const updateUser = (id, status) => {
    if (!permissions.suspendAccounts) {
      setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to update account status.' });
      return;
    }
    updateUserStatus(id, status);
  };

  const updateSoftware = (id, status) => {
    if (!permissions.moderateSoftware) {
      setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to moderate software.' });
      return;
    }
    updateSoftwareStatus(id, status);
  };

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

  const toggleUserSelect = (id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSoftwareSelect = (id) => {
    setSelectedSoftwareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allUsersOnPageSelected = usersPageRows.length > 0 && usersPageRows.every((u) => selectedUserIds.has(u.id));
  const allSoftwareOnPageSelected = softwarePageRows.length > 0 && softwarePageRows.every((s) => selectedSoftwareIds.has(s.id));

  const toggleAllUsersOnPage = (checked) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      usersPageRows.forEach((u) => {
        if (checked) next.add(u.id);
        else next.delete(u.id);
      });
      return next;
    });
  };

  const toggleAllSoftwareOnPage = (checked) => {
    setSelectedSoftwareIds((prev) => {
      const next = new Set(prev);
      softwarePageRows.forEach((s) => {
        if (checked) next.add(s.id);
        else next.delete(s.id);
      });
      return next;
    });
  };

  const applyUserBulkAction = () => {
    if (!userBulkAction || selectedUserIds.size === 0) return;
    if (userBulkAction === 'warn') {
      setFeedback({ variant: 'info', title: 'Bulk notification sent', message: `Warnings sent to ${selectedUserIds.size} users.` });
    } else if (userBulkAction === 'suspend') {
      selectedUserIds.forEach((id) => updateUser(id, 'Suspended'));
    } else if (userBulkAction === 'activate') {
      selectedUserIds.forEach((id) => updateUser(id, 'Active'));
    }
    setSelectedUserIds(new Set());
    setUserBulkAction('');
  };

  const applySoftwareBulkAction = () => {
    if (!softwareBulkAction || selectedSoftwareIds.size === 0) return;
    if ((softwareBulkAction === 'reject' || softwareBulkAction === 'archive') && !permissions.destructiveActions) {
      setFeedback({ variant: 'warning', title: 'Limited privilege', message: 'Bulk reject/archive actions require super admin privilege.' });
      return;
    }
    const actionMap = { approve: 'Approved', reject: 'Rejected', archive: 'Archived' };
    const status = actionMap[softwareBulkAction];
    selectedSoftwareIds.forEach((id) => updateSoftware(id, status));
    setSelectedSoftwareIds(new Set());
    setSoftwareBulkAction('');
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
        <AdminSidebar
          navItems={NAV_ITEMS}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          theme={theme}
          setTheme={setTheme}
          onBack={onBack}
        />

        <div className="adm-content-wrap" id="adm-main">
          <AdminHeader
            isSuperAdmin={isSuperAdmin}
            unread={unread}
            lastSyncAt={lastSyncAt}
            search={searchInput}
            onSearchChange={setSearchInput}
            onOpenAlerts={() => setActiveSection('notifications')}
            onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
          />

          {feedback && <FeedbackMessage {...feedback} onClose={() => setFeedback(null)} />}
          {loading && <SkeletonDashboard />}

          {!loading && activeSection === 'overview' && (
            <OverviewSection metrics={metrics} permissions={permissions} series={series} logs={logs} />
          )}

          {!loading && activeSection === 'users' && (
            <UsersSection
              usersPageRows={usersPageRows}
              userRole={userRole}
              setUserRole={setUserRole}
              userStatus={userStatus}
              setUserStatus={setUserStatus}
              userTotalPages={userTotalPages}
              userPage={userPage}
              setUserPage={setUserPage}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              selectedUserIds={selectedUserIds}
              allUsersOnPageSelected={allUsersOnPageSelected}
              onToggleAllUsersOnPage={toggleAllUsersOnPage}
              onToggleUserSelect={toggleUserSelect}
              userBulkAction={userBulkAction}
              setUserBulkAction={setUserBulkAction}
              onApplyUserBulkAction={applyUserBulkAction}
              assignUserRole={assignUserRole}
              updateUser={updateUser}
              setConfirm={setConfirm}
              setFeedback={setFeedback}
            />
          )}

          {!loading && activeSection === 'software' && (
            <SoftwareSection
              softwarePageRows={softwarePageRows}
              softwareTotalPages={softwareTotalPages}
              softwarePage={softwarePage}
              setSoftwarePage={setSoftwarePage}
              selectedSoftwareIds={selectedSoftwareIds}
              allSoftwareOnPageSelected={allSoftwareOnPageSelected}
              onToggleAllSoftwareOnPage={toggleAllSoftwareOnPage}
              onToggleSoftwareSelect={toggleSoftwareSelect}
              softwareBulkAction={softwareBulkAction}
              setSoftwareBulkAction={setSoftwareBulkAction}
              onApplySoftwareBulkAction={applySoftwareBulkAction}
              updateSoftware={updateSoftware}
              permissions={permissions}
              setConfirm={setConfirm}
              setFeedback={setFeedback}
            />
          )}

          {!loading && activeSection === 'analytics' && (
            <AnalyticsSection
              dateRange={dateRange}
              setDateRange={setDateRange}
              exportCsv={exportCsv}
              exportPdf={exportPdf}
              series={series}
              topSoftware={topSoftware}
            />
          )}

          {!loading && activeSection === 'logs' && (
            <LogsSection
              logsPageRows={logsPageRows}
              logTotalPages={logTotalPages}
              logPage={logPage}
              setLogPage={setLogPage}
            />
          )}

          {!loading && activeSection === 'notifications' && (
            <section className="adm-panel">
              <div className="adm-section-head"><h2>Notifications & Alerts</h2></div>
              <ul className="adm-notifications">
                {notifications.map((n) => (
                  <li key={n.id} className={n.unread ? 'unread' : ''}>
                    <div><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.time).toLocaleString()}</small></div>
                    <div className="adm-actions">
                      <Pill value={n.severity} />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!permissions.manageAlerts) {
                            setFeedback({ variant: 'error', title: 'Access denied', message: 'You do not have permission to manage alerts.' });
                            return;
                          }
                          await markNotificationRead(n);
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
