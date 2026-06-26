import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import {
  softwareSchema,
  softwareSummarySchema,
  softwareVersionSchema,
  type Software,
  type SoftwareSummary,
  type SoftwareVersion,
} from '../model/software.schema';

async function fetchSoftware(limit: number): Promise<Software[]> {
  const response = await httpClient.get('/api/v1/software-management', { params: { limit } });
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map((row) => softwareSchema.parse(row));
}

export function useSoftwareList(limit = 100) {
  return useQuery({
    queryKey: queryKeys.software.list(limit),
    queryFn: () => fetchSoftware(limit),
  });
}

async function fetchSoftwareVersions(softwareId: string, limit: number): Promise<SoftwareVersion[]> {
  const response = await httpClient.get(`/api/v1/software-management/${softwareId}/versions`, { params: { limit } });
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

async function fetchAdminSummary(): Promise<SoftwareSummary> {
  const response = await httpClient.get('/api/v1/software-management/admin/summary');
  return softwareSummarySchema.parse(response.data || {});
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
