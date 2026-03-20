import { useCallback, useEffect, useReducer } from 'react';
import { authApi as api } from '../API_Wrapper';

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
  { id: 'PKG-301', name: 'Core Runtime', version: '2.0.1', owner: 'Ava Reynolds', uploadDate: '2026-03-01T09:00:00Z', status: 'Approved', downloads: 1430, virusFlagged: false },
  { id: 'PKG-302', name: 'Secure Agent', version: '1.4.8', owner: 'Noah Kim', uploadDate: '2026-03-03T07:10:00Z', status: 'Pending', downloads: 221, virusFlagged: false },
  { id: 'PKG-303', name: 'Bridge Plugin', version: '0.9.1', owner: 'Liam Stone', uploadDate: '2026-02-24T09:00:00Z', status: 'Flagged', downloads: 560, virusFlagged: true },
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

const initialState = {
  loading: true,
  feedback: null,
  users: SAMPLE_USERS,
  software: SAMPLE_SOFTWARE,
  logs: SAMPLE_LOGS,
  notifications: SAMPLE_NOTIFICATIONS,
  summary: null,
  series: METRIC_SERIES,
  lastSyncAt: null,
};

const dayKey = (value) => new Date(value).toISOString().slice(0, 10);
const lastNDays = (n) => Array.from({ length: n }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1 - i));
  return dayKey(d);
});

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return {
        ...state,
        ...action.payload,
        loading: false,
        lastSyncAt: new Date().toISOString(),
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        loading: false,
        feedback: { variant: 'warning', title: 'Offline sample mode', message: 'Live admin APIs unavailable. Showing local dataset.' },
        lastSyncAt: new Date().toISOString(),
      };
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };
    case 'UPDATE_USER_STATUS':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.payload.id ? { ...u, status: action.payload.status } : u)),
      };
    case 'ASSIGN_USER_ROLE':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.payload.id ? { ...u, role: action.payload.role } : u)),
      };
    case 'UPDATE_SOFTWARE_STATUS':
      return {
        ...state,
        software: state.software.map((s) => (s.id === action.payload.id ? { ...s, status: action.payload.status } : s)),
      };
    case 'ACK_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.payload ? { ...n, unread: false } : n)),
      };
    default:
      return state;
  }
}

export default function useAdminData() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    try {
      const [u, p, s, a, ev] = await Promise.all([
        api.get('/api/v1/users', { params: { limit: 30 } }),
        api.get('/api/v1/software-management/admin/packages', { params: { limit: 30 } }),
        api.get('/api/v1/software-management/admin/summary'),
        api.get('/api/v1/admin/alerts', { params: { only_unacknowledged: false, limit: 100 } }),
        api.get('/api/v1/admin/audit-events', { params: { limit: 400 } }),
      ]);

      const users = Array.isArray(u.data) && u.data.length
        ? u.data.map((x) => ({
          id: x.id,
          name: x.full_name || x.username || `User ${x.id}`,
          email: x.email || 'N/A',
          role: x.role || 'Viewer',
          status: 'Active',
          lastActive: x.updated_at || x.created_at || new Date().toISOString(),
          registered: x.created_at || new Date().toISOString(),
        }))
        : SAMPLE_USERS;

      const software = Array.isArray(p.data) && p.data.length
        ? p.data.map((x) => {
          const rawStatus = x.status || (x.is_public ? 'Approved' : 'Pending');
          const virusFlagged = Boolean(x.virus_flagged || x.is_flagged || String(rawStatus).toLowerCase().includes('flagged'));
          return {
            id: x.package_id || x.id,
            name: x.name || 'Package',
            version: x.latest_version || 'N/A',
            owner: x.owner_id || 'Unknown',
            uploadDate: x.created_at || x.updated_at || new Date().toISOString(),
            status: rawStatus,
            downloads: Number(x.download_count || 0),
            virusFlagged,
          };
        })
        : SAMPLE_SOFTWARE;

      const summary = s.data || null;

      const alertRows = a.data?.items || [];
      const notifications = alertRows.length
        ? alertRows.map((item) => ({
          id: item.id,
          apiId: item.id,
          title: item.title || 'Alert',
          message: item.description || 'Alert details unavailable.',
          severity: String(item.severity || 'Info'),
          unread: !item.acknowledged,
          time: item.created_at || new Date().toISOString(),
        }))
        : SAMPLE_NOTIFICATIONS;

      const eventRows = ev.data?.items || [];
      const logs = eventRows.length
        ? eventRows.map((item) => ({
          id: item.id,
          type: item.event_type || 'Audit event',
          actor: item.actor_username || item.actor_user_id || 'System',
          details: `${item.method || ''} ${item.path || ''}`.trim() || 'Event details unavailable.',
          severity: item.success ? 'Info' : 'Warning',
          time: item.occurred_at || new Date().toISOString(),
        }))
        : SAMPLE_LOGS;

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

      const series = {
        users: usersDaily.some(Boolean) ? usersDaily : METRIC_SERIES.users,
        downloads: downloadDaily.some(Boolean) ? downloadDaily : METRIC_SERIES.downloads,
        sessions: sessionsDaily.some(Boolean) ? sessionsDaily : METRIC_SERIES.sessions,
      };

      dispatch({ type: 'LOAD_SUCCESS', payload: { users, software, summary, notifications, logs, series } });
    } catch {
      dispatch({ type: 'LOAD_ERROR' });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const safeLoad = async () => {
      if (!alive) return;
      await load();
    };
    safeLoad();
    const timer = window.setInterval(safeLoad, 60000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [load]);

  const setFeedback = (payload) => dispatch({ type: 'SET_FEEDBACK', payload });
  const updateUserStatus = (id, status) => dispatch({ type: 'UPDATE_USER_STATUS', payload: { id, status } });
  const assignUserRole = (id, role) => dispatch({ type: 'ASSIGN_USER_ROLE', payload: { id, role } });
  const updateSoftwareStatus = (id, status) => dispatch({ type: 'UPDATE_SOFTWARE_STATUS', payload: { id, status } });
  const markNotificationRead = async (notification) => {
    try {
      if (notification.apiId) await api.patch(`/api/v1/admin/alerts/${notification.apiId}/ack`);
    } catch {
      // Keep optimistic UI behavior even if acknowledgement fails.
    }
    dispatch({ type: 'ACK_NOTIFICATION', payload: notification.id });
  };

  return {
    ...state,
    setFeedback,
    updateUserStatus,
    assignUserRole,
    updateSoftwareStatus,
    markNotificationRead,
  };
}
