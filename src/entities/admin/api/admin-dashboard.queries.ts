import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi as api } from '../../../API_Wrapper';

const METRIC_SERIES = {
  users: [8, 10, 11, 13, 15, 16, 20, 21, 23, 24, 28, 31],
  downloads: [230, 240, 260, 300, 340, 360, 390, 420, 460, 490, 515, 552],
  sessions: [90, 110, 115, 120, 140, 130, 150, 162, 158, 169, 172, 188],
};

const SAMPLE_USERS = [
  { id: 2001, name: 'Ava Reynolds', email: 'ava@platform.io', role: 'Admin', status: 'Active', lastActive: '2026-03-03T09:00:00Z', registered: '2025-07-18T09:00:00Z' },
];
const SAMPLE_SOFTWARE = [
  { id: 'PKG-301', name: 'Core Runtime', version: '2.0.1', owner: 'Ava Reynolds', uploadDate: '2026-03-01T09:00:00Z', status: 'Approved', downloads: 1430, virusFlagged: false },
];
const SAMPLE_LOGS = [{ id: 'L1', type: 'Authentication event', actor: 'System', details: 'Failed login attempts', severity: 'Critical', time: '2026-03-03T07:13:00Z' }];
const SAMPLE_NOTIFICATIONS = [{ id: 'N1', title: 'High risk login', message: 'Authentication anomaly detected', severity: 'Critical', unread: true, time: '2026-03-03T07:13:00Z' }];

const dayKey = (value: string) => new Date(value).toISOString().slice(0, 10);
const lastNDays = (n: number) => Array.from({ length: n }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1 - i));
  return dayKey(d.toISOString());
});

async function fetchAdminDashboard() {
  const [u, p, s, a, ev] = await Promise.all([
    api.get('/api/v1/users', { params: { limit: 30 } }),
    api.get('/api/v1/software-management/admin/packages', { params: { limit: 30 } }),
    api.get('/api/v1/software-management/admin/summary'),
    api.get('/api/v1/admin/alerts', { params: { only_unacknowledged: false, limit: 100 } }),
    api.get('/api/v1/admin/audit-events', { params: { limit: 400 } }),
  ]);

  const users = Array.isArray(u.data) && u.data.length ? u.data.map((x: any) => ({ id: x.id, name: x.full_name || x.username || `User ${x.id}`, email: x.email || 'N/A', role: x.role || 'Viewer', status: 'Active', lastActive: x.updated_at || x.created_at || new Date().toISOString(), registered: x.created_at || new Date().toISOString() })) : SAMPLE_USERS;
  const software = Array.isArray(p.data) && p.data.length ? p.data.map((x: any) => ({ id: x.package_id || x.id, name: x.name || 'Package', version: x.latest_version || 'N/A', owner: x.owner_id || 'Unknown', uploadDate: x.created_at || x.updated_at || new Date().toISOString(), status: x.status || (x.is_public ? 'Approved' : 'Pending'), downloads: Number(x.download_count || 0), virusFlagged: Boolean(x.virus_flagged || x.is_flagged) })) : SAMPLE_SOFTWARE;

  const alertRows = a.data?.items || [];
  const notifications = alertRows.length ? alertRows.map((item: any) => ({ id: item.id, apiId: item.id, title: item.title || 'Alert', message: item.description || 'Alert details unavailable.', severity: String(item.severity || 'Info'), unread: !item.acknowledged, time: item.created_at || new Date().toISOString() })) : SAMPLE_NOTIFICATIONS;

  const eventRows = ev.data?.items || [];
  const logs = eventRows.length ? eventRows.map((item: any) => ({ id: item.id, type: item.event_type || 'Audit event', actor: item.actor_username || item.actor_user_id || 'System', details: `${item.method || ''} ${item.path || ''}`.trim() || 'Event details unavailable.', severity: item.success ? 'Info' : 'Warning', time: item.occurred_at || new Date().toISOString() })) : SAMPLE_LOGS;

  const days = lastNDays(12);
  const usersDaily = days.map((day) => (Array.isArray(u.data) ? u.data.filter((row: any) => row.created_at && dayKey(row.created_at) === day).length : 0));
  const downloadDaily = days.map((day) => eventRows.filter((row: any) => row.occurred_at && dayKey(row.occurred_at) === day && String(row.path || '').includes('/download')).length);
  const sessionsDaily = days.map((day) => new Set(eventRows.filter((row: any) => row.occurred_at && dayKey(row.occurred_at) === day && row.actor_user_id).map((row: any) => row.actor_user_id)).size);

  const series = {
    users: usersDaily.some(Boolean) ? usersDaily : METRIC_SERIES.users,
    downloads: downloadDaily.some(Boolean) ? downloadDaily : METRIC_SERIES.downloads,
    sessions: sessionsDaily.some(Boolean) ? sessionsDaily : METRIC_SERIES.sessions,
  };

  return { users, software, summary: s.data || null, notifications, logs, series, lastSyncAt: new Date().toISOString() };
}

export function useAdminDashboardData() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchAdminDashboard, refetchInterval: 60_000 });
  const [feedback, setFeedback] = useState<any>(null);
  const [users, setUsers] = useState<any[]>(SAMPLE_USERS);
  const [software, setSoftware] = useState<any[]>(SAMPLE_SOFTWARE);
  const [notifications, setNotifications] = useState<any[]>(SAMPLE_NOTIFICATIONS);
  const [logs, setLogs] = useState<any[]>(SAMPLE_LOGS);
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any>(METRIC_SERIES);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setUsers(query.data.users || SAMPLE_USERS);
    setSoftware(query.data.software || SAMPLE_SOFTWARE);
    setNotifications(query.data.notifications || SAMPLE_NOTIFICATIONS);
    setLogs(query.data.logs || SAMPLE_LOGS);
    setSummary(query.data.summary || null);
    setSeries(query.data.series || METRIC_SERIES);
    setLastSyncAt(query.data.lastSyncAt || null);
  }, [query.data]);

  const markNotificationRead = useCallback(async (notification: any) => {
    try {
      if (notification.apiId) await api.patch(`/api/v1/admin/alerts/${notification.apiId}/ack`);
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n)));
  }, []);

  return {
    loading: query.isLoading,
    feedback: feedback || (query.isError ? { variant: 'warning', title: 'Offline sample mode', message: 'Live admin APIs unavailable. Showing local dataset.' } : null),
    users,
    software,
    logs,
    notifications,
    summary,
    series,
    lastSyncAt,
    setFeedback,
    updateUserStatus: (id: any, status: any) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u))),
    assignUserRole: (id: any, role: any) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u))),
    updateSoftwareStatus: (id: any, status: any) => setSoftware((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s))),
    markNotificationRead,
  };
}
