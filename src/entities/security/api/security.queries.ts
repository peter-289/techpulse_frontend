import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { fetchSoftwareList } from '../../software/api/software.queries';
import { softwareVersionSchema } from '../../software/model/software.schema';
import {
  classifyScanStatus,
  securityScanSchema,
  type SecurityScan,
} from '../model/security.schema';

async function deriveFromVersions(limit: number): Promise<SecurityScan[]> {
  const software = await fetchSoftwareList(limit);
  const results = await Promise.allSettled(
    software.slice(0, 12).map(async (item) => {
      const response = await api.get(`/api/v1/software-management/${item.id}/versions`, {
        params: { limit: 5 },
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      return rows.map((row) => {
        const version = softwareVersionSchema.parse(row);
        return securityScanSchema.parse({
          id: `${version.software_id}:${version.version}`,
          softwareId: version.software_id,
          softwareName: item.name,
          version: version.version,
          file: version.file_name || `${item.name}-${version.version}`,
          result: classifyScanStatus(version.artifact_status),
          engine: 'Scan pipeline',
          quarantineReason: version.quarantine_reason,
          createdAt: version.created_at || version.published_at || '',
        });
      });
    }),
  );

  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

async function fetchSecurityScans(limit: number): Promise<SecurityScan[]> {
  try {
    const response = await api.get('/api/v1/security/scans', { params: { limit } });
    const rows = Array.isArray(response.data) ? response.data : [];
    if (rows.length) {
      return rows.map((row) => {
        const record = row as Record<string, unknown>;
        return securityScanSchema.parse({
          id: String(record.id ?? crypto.randomUUID()),
          softwareId: String(record.software_id ?? ''),
          softwareName: record.software_name ?? 'Untitled software',
          version: record.version ?? '—',
          file: record.file_name ?? record.file ?? '—',
          result: classifyScanStatus(record.result ?? record.status ?? record.artifact_status),
          engine: record.engine ?? 'Scan pipeline',
          quarantineReason: record.quarantine_reason ?? null,
          createdAt: record.created_at ?? '',
        });
      });
    }
  } catch {
    // Endpoint not available — derive scan results from version artifact states.
  }
  return deriveFromVersions(limit);
}

export function useSecurityScans(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'security-scans', { limit }] as const,
    queryFn: () => fetchSecurityScans(limit),
  });
}
