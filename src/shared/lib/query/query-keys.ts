/**
 * Query keys factory for TanStack Query
 * FSD-aligned, type-safe query keys
 */
export const queryKeys = {
  software: {
    all: ['software'] as const,
    list: (limit: number) => [...queryKeys.software.all, 'list', { limit }] as const,
    detail: (id: string) => [...queryKeys.software.all, 'detail', id] as const,
    versions: (softwareId: string, limit: number) =>
      [...queryKeys.software.all, 'versions', softwareId, { limit }] as const,
    summary: () => [...queryKeys.software.all, 'summary'] as const,
    adminSummary: () => [...queryKeys.software.all, 'admin-summary'] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (limit: number) => [...queryKeys.categories.all, 'list', { limit }] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    list: (limit: number) => [...queryKeys.users.all, 'list', { limit }] as const,
  },
  admin: {
    all: ['admin'] as const,
    dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,
    alerts: (unack: boolean, limit: number) =>
      [...queryKeys.admin.all, 'alerts', { unack, limit }] as const,
    auditEvents: (limit: number) =>
      [...queryKeys.admin.all, 'audit-events', { limit }] as const,
  },
  support: {
    all: ['support'] as const,
    messages: (limit: number) => [...queryKeys.support.all, 'messages', { limit }] as const,
  },
};
