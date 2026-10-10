import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import {
  classifyScanStatus,
  securityScanSchema,
  securitySummarySchema,
  type SecurityScan,
} from '../model/security.schema';

async function fetchSecurityScans(limit: number): Promise<SecurityScan[]> {
  const response = await api.get('/api/v1/security/scans', { params: { limit } });
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map((row) => {
    const record = row as Record<string, unknown>;
    return securityScanSchema.parse({
      id: String(record.id ?? crypto.randomUUID()),
      artifactId: String(record.artifact_id ?? record.id ?? ''),
      softwareId: String(record.software_id ?? ''),
      softwareName: record.software_name ?? 'Untitled software',
      version: record.version ?? '—',
      file: record.file_name ?? record.file ?? '—',
      result: classifyScanStatus(record.verdict ?? record.result ?? record.status),
      engine: record.provider ?? 'Scan pipeline',
      quarantineReason: record.quarantine_reason ?? null,
      createdAt: record.updated_at ?? record.created_at ?? '',
    });
  });
}

export function useSecurityScans(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'security-scans', { limit }] as const,
    queryFn: () => fetchSecurityScans(limit),
  });
}

export function useSecurityScanReports(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'security-scan-reports', { limit }] as const,
    queryFn: async () => {
      const response = await api.get('/api/v1/security/scan-reports', { params: { limit } });
      const rows = Array.isArray(response.data) ? response.data : [];
      return rows.map((row) => {
        const record = row as Record<string, unknown>;
        return securityScanSchema.parse({
          id: String(record.id ?? crypto.randomUUID()),
          artifactId: String(record.artifact_id ?? record.id ?? ''),
          softwareId: String(record.software_id ?? ''),
          softwareName: record.software_name ?? 'Untitled software',
          version: record.version ?? '—',
          file: record.file_name ?? record.file ?? '—',
          result: classifyScanStatus(record.verdict ?? record.result ?? record.status),
          engine: record.provider ?? 'Scan pipeline',
          quarantineReason: record.quarantine_reason ?? null,
          createdAt: record.updated_at ?? record.created_at ?? '',
        });
      });
    },
  });
}

export function useSecuritySummary() {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'security-summary'] as const,
    queryFn: async () => {
      const response = await api.get('/api/v1/security/summary');
      return securitySummarySchema.parse(response.data);
    },
  });
}
