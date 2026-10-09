import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { fetchSoftwareList } from '../../software/api/software.queries';
import { analyticsSummarySchema, type AnalyticsSummary } from '../model/analytics.schema';

const dayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

async function fetchDailyDownloads(days: number): Promise<{ day: string; value: number }[]> {
  const dayList = Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    return dayKey(date.toISOString());
  });

  try {
    const response = await api.get('/api/v1/admin/audit-events', { params: { limit: 500 } });
    const rows = Array.isArray(response.data)
      ? response.data
      : ((response.data as { items?: unknown[] })?.items ?? []);

    const counts = new Map<string, number>(dayList.map((day) => [day, 0]));
    rows.forEach((row) => {
      const record = row as Record<string, unknown>;
      const path = String(record.path ?? '');
      const occurredAt = String(record.occurred_at ?? record.created_at ?? '');
      if (!occurredAt || !path.includes('/download')) return;
      const key = dayKey(occurredAt);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return dayList.map((day) => ({ day, value: counts.get(day) ?? 0 }));
  } catch {
    return dayList.map((day) => ({ day, value: 0 }));
  }
}

async function fetchAnalytics(limit: number, days: number): Promise<AnalyticsSummary> {
  try {
    const response = await api.get('/api/v1/analytics', { params: { limit, days } });
    const parsed = analyticsSummarySchema.safeParse(response.data);
    if (parsed.success) return parsed.data;
  } catch {
    // Endpoint not available — derive from the software catalogue.
  }

  const [software, daily] = await Promise.all([fetchSoftwareList(limit), fetchDailyDownloads(days)]);
  const totalDownloads = software.reduce((sum, item) => sum + Number(item.download_count || 0), 0);
  const topSoftware = [...software]
    .sort((a, b) => Number(b.download_count || 0) - Number(a.download_count || 0))
    .slice(0, 5)
    .map((item) => ({ id: item.id, name: item.name, downloads: Number(item.download_count || 0) }));

  return analyticsSummarySchema.parse({
    totalDownloads,
    activeSoftware: software.filter((item) => item.is_public).length,
    totalSoftware: software.length,
    series: daily.map((point) => ({
      day: point.day,
      label: new Date(point.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      value: point.value,
    })),
    topSoftware,
  });
}

export function useAnalytics(limit = 100, days = 12) {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'analytics', { limit, days }] as const,
    queryFn: () => fetchAnalytics(limit, days),
  });
}
