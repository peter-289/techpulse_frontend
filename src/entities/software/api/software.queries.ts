import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import {
  softwareSchema,
  softwareSummarySchema,
  softwareVersionSchema,
  type Software,
  type SoftwareSummary,
  type SoftwareVersion,
} from '../model/software.schema';

export function normalizeSoftwareResponse(responseData: unknown): Software[] {
  const rows = Array.isArray(responseData)
    ? responseData
    : [];

  const unwrappedRows = Array.isArray(rows[0]) && rows.length === 2 ? rows[0] : rows;

  return (Array.isArray(unwrappedRows) ? unwrappedRows : []).map((row) => softwareSchema.parse(row));
}

export async function fetchSoftwareList(limit: number): Promise<Software[]> {
  const response = await api.get('/api/v1/software-management', { params: { limit } });
  return normalizeSoftwareResponse(response.data);
}

export function useSoftwareList(limit = 100) {
  return useQuery({
    queryKey: queryKeys.software.list(limit),
    queryFn: () => fetchSoftwareList(limit),
  });
}

async function fetchSoftwareDetail(id: string): Promise<Software> {
  const response = await api.get(`/api/v1/software-management/${id}`);
  const raw = response.data;
  const candidate = Array.isArray(raw) ? raw[0] : (raw?.data ?? raw);
  return softwareSchema.parse(candidate);
}

export function useSoftwareDetail(id?: string | null) {
  return useQuery({
    queryKey: queryKeys.software.detail(String(id || '')),
    queryFn: () => fetchSoftwareDetail(String(id)),
    enabled: Boolean(id),
    retry: false,
  });
}

async function fetchSoftwareVersions(softwareId: string, limit: number): Promise<SoftwareVersion[]> {
  const response = await api.get(`/api/v1/software-management/${softwareId}/versions`, { params: { limit } });
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map((row) => softwareVersionSchema.parse(row));
}

export function useSoftwareVersions(softwareId: string | null | undefined, limit = 20) {
  return useQuery({
    queryKey: queryKeys.software.versions(String(softwareId || ''), limit),
    queryFn: () => fetchSoftwareVersions(String(softwareId), limit),
    enabled: Boolean(softwareId),
  });
}

export type SoftwareVersionFeedItem = SoftwareVersion & { softwareName: string };

async function fetchSoftwareVersionsFeed(limit: number): Promise<SoftwareVersionFeedItem[]> {
  const software = await fetchSoftwareList(limit);
  const results = await Promise.allSettled(
    software.map(async (item) => {
      const versions = await fetchSoftwareVersions(item.id, 20);
      return versions.map((version) => ({ ...version, softwareName: item.name }));
    }),
  );
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

export function useSoftwareVersionsFeed(limit = 100) {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'versions-feed', { limit }] as const,
    queryFn: () => fetchSoftwareVersionsFeed(limit),
  });
}

/**
 * Resolve a single version from the versions collection. Shares the cache
 * with `useSoftwareVersions` so deep links and lists stay in sync.
 */
export function useSoftwareVersion(
  softwareId?: string | null,
  version?: string | null,
  _limit = 50,
) {
  const query = useQuery({
    queryKey: [...queryKeys.software.all, 'version', String(softwareId || ''), String(version || '')] as const,
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/software-management/${softwareId}/versions/${encodeURIComponent(String(version))}`,
      );
      return softwareVersionSchema.parse(response.data);
    },
    enabled: Boolean(softwareId && version),
    retry: false,
  });
  return { ...query, versionData: query.data ?? null };
}

async function fetchSoftwareSummary(): Promise<SoftwareSummary> {
  const response = await api.get('/api/v1/software-management/summary');
  return softwareSummarySchema.parse(response.data || {});
}

export function useSoftwareSummary() {
  return useQuery({
    queryKey: queryKeys.software.summary(),
    queryFn: fetchSoftwareSummary,
    retry: false,
  });
}

async function fetchAdminSummary(): Promise<SoftwareSummary> {
  const response = await api.get('/api/v1/admin/software/summary');

  //console.log("SUMMARY RESPONSE:", response.data);
  const parsed = softwareSummarySchema.parse(response.data || {});

  //console.log("SUMMARY PARSED:", parsed)

  return parsed
}

export function useSoftwareAdminSummary() {
  return useQuery({
    queryKey: queryKeys.software.adminSummary(),
    queryFn: fetchAdminSummary,
    retry: false,
  });
}

export function buildSoftwareDownloadUrl(softwareId: string, version: string) {
  return `/api/v1/software-management/${softwareId}/versions/${encodeURIComponent(version)}/download`;
}
