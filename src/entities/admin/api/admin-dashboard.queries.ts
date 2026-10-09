import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { ApiError } from '@/shared/lib/api/api-error';
import {
  useAcknowledgeAlert,
  useAssignUserRole,
  useReviewSoftwarePackage,
  useUpdateUserStatus,
} from './admin.mutations';

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

  const users = Array.isArray(u.data)
    ? u.data.map((x: any) => ({
        id: x.id,
        name: x.full_name || x.username || `User ${x.id}`,
        email: x.email || 'N/A',
        role: x.role || 'Viewer',
        status: 'Active',
        lastActive: x.updated_at || x.created_at || new Date().toISOString(),
        registered: x.created_at || new Date().toISOString(),
      }))
    : [];
  const software = Array.isArray(p.data)
    ? p.data.map((x: any) => ({
        id: x.package_id || x.id,
        name: x.name || 'Package',
        version: x.latest_version || 'N/A',
        owner: x.owner_id || 'Unknown',
        uploadDate: x.created_at || x.updated_at || new Date().toISOString(),
        status: x.status || (x.is_public ? 'Approved' : 'Pending'),
        downloads: Number(x.download_count || 0),
        virusFlagged: Boolean(x.virus_flagged || x.is_flagged),
      }))
    : [];

  const alertRows = a.data?.items || [];
  const notifications = alertRows.map((item: any) => ({
    id: item.id,
    apiId: item.id,
    title: item.title || 'Alert',
    message: item.description || 'Alert details unavailable.',
    severity: String(item.severity || 'Info'),
    unread: !item.acknowledged,
    time: item.created_at || new Date().toISOString(),
  }));

  const eventRows = ev.data?.items || [];
  const logs = eventRows.map((item: any) => ({
    id: item.id,
    type: item.event_type || 'Audit event',
    actor: item.actor_username || item.actor_user_id || 'System',
    details: `${item.method || ''} ${item.path || ''}`.trim() || 'Event details unavailable.',
    severity: item.success ? 'Info' : 'Warning',
    time: item.occurred_at || new Date().toISOString(),
  }));

  const days = lastNDays(12);
  const usersDaily = days.map((day) =>
    Array.isArray(u.data)
      ? u.data.filter((row: any) => row.created_at && dayKey(row.created_at) === day).length
      : 0
  );
  const downloadDaily = days.map((day) =>
    eventRows.filter(
      (row: any) =>
        row.occurred_at && dayKey(row.occurred_at) === day && String(row.path || '').includes('/download')
    ).length
  );
  const sessionsDaily = days.map((day) => {
    const ids = new Set(
      eventRows
        .filter((row: any) => row.occurred_at && dayKey(row.occurred_at) === day && row.actor_user_id)
        .map((row: any) => row.actor_user_id)
    );
    return ids.size;
  });

  const series = {
    users: usersDaily,
    downloads: downloadDaily,
    sessions: sessionsDaily,
  };

  return { users, software, summary: s.data || null, notifications, logs, series, lastSyncAt: new Date().toISOString() };
}

export function useAdminDashboardData() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchAdminDashboard, refetchInterval: 60_000 });
  const [feedback, setFeedback] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [software, setSoftware] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any>({ users: [], downloads: [], sessions: [] });
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setUsers(query.data.users || []);
    setSoftware(query.data.software || []);
    setNotifications(query.data.notifications || []);
    setLogs(query.data.logs || []);
    setSummary(query.data.summary || null);
    setSeries(query.data.series || { users: [], downloads: [], sessions: [] });
    setLastSyncAt(query.data.lastSyncAt || null);
  }, [query.data]);

  const updateUserStatusMutation = useUpdateUserStatus();
  const assignUserRoleMutation = useAssignUserRole();
  const reviewPackageMutation = useReviewSoftwarePackage();
  const acknowledgeAlertMutation = useAcknowledgeAlert();

  const runOptimistic = useCallback(
    async (apply: () => void, action: () => Promise<unknown>, failureMessage: string) => {
      apply();
      try {
        await action();
      } catch (err) {
        setFeedback({
          variant: 'error',
          title: 'Action failed',
          message: (err as ApiError)?.message || failureMessage,
        });
        await query.refetch();
      }
    },
    [query],
  );

  const markNotificationRead = useCallback(
    async (notification: any) => {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n)));
      try {
        if (notification.apiId) await acknowledgeAlertMutation.mutateAsync(notification.apiId);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.debug('Failed to ack alert:', err);
        }
      }
    },
    [acknowledgeAlertMutation],
  );

  const apiError = query.error as ApiError | null;
  return {
    loading: query.isLoading,
    feedback:
      feedback ||
      (query.isError
        ? {
            variant: 'error',
            title: 'Failed to load admin data',
            message: apiError?.message || 'Unable to fetch admin dashboard data.',
          }
        : null),
    users,
    software,
    logs,
    notifications,
    summary,
    series,
    lastSyncAt,
    setFeedback,
    updateUserStatus: (id: any, status: any) =>
      runOptimistic(
        () => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u))),
        () => updateUserStatusMutation.mutateAsync({ userId: id, status }),
        'Could not update user status.',
      ),
    assignUserRole: (id: any, role: any) =>
      runOptimistic(
        () => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u))),
        () => assignUserRoleMutation.mutateAsync({ userId: id, role }),
        'Could not update user role.',
      ),
    approveSoftware: (id: any) =>
      runOptimistic(
        () => setSoftware((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Approved' } : s))),
        () => reviewPackageMutation.mutateAsync({ packageId: id, decision: 'approve' }),
        'Could not approve package.',
      ),
    rejectSoftware: (id: any) =>
      runOptimistic(
        () => setSoftware((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Rejected' } : s))),
        () => reviewPackageMutation.mutateAsync({ packageId: id, decision: 'reject' }),
        'Could not reject package.',
      ),
    quarantineSoftware: (id: any) =>
      runOptimistic(
        () => setSoftware((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Quarantined' } : s))),
        () => reviewPackageMutation.mutateAsync({ packageId: id, decision: 'quarantine' }),
        'Could not quarantine package.',
      ),
    markNotificationRead,
  };
}
