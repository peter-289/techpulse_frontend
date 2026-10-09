import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { auditEventSchema, inferAuditCategory, type AuditEvent } from '../model/audit.schema';

async function fetchAuditEvents(limit: number): Promise<AuditEvent[]> {
  const response = await api.get('/api/v1/admin/audit-events', { params: { limit } });
  const rows = Array.isArray(response.data)
    ? response.data
    : ((response.data as { items?: unknown[] })?.items ?? []);

  return rows.map((row) => {
    const record = row as Record<string, unknown>;
    const method = String(record.method ?? '');
    const path = String(record.path ?? '');
    const eventType = String(record.event_type ?? 'Audit event');
    const actor = String(record.actor_username ?? record.actor_user_id ?? 'System');
    const title = eventType !== 'Audit event' ? eventType : `${method} ${path}`.trim() || 'Audit event';

    return auditEventSchema.parse({
      id: String(record.id ?? crypto.randomUUID()),
      title: actor === 'System' ? title : `${title} — ${actor}`,
      actor,
      details: `${method} ${path}`.trim(),
      category: inferAuditCategory(path, eventType),
      success: record.success !== false,
      occurredAt: String(record.occurred_at ?? record.created_at ?? ''),
    });
  });
}

export function useAuditEvents(limit = 100) {
  return useQuery({
    queryKey: queryKeys.admin.auditEvents(limit),
    queryFn: () => fetchAuditEvents(limit),
    retry: false,
  });
}
