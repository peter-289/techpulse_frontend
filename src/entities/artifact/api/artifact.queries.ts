import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { artifactSchema, type Artifact } from '../model/artifact.schema';

function mapEndpointRows(data: unknown): Artifact[] {
  const rows = Array.isArray(data) ? data : ((data as { items?: unknown[] })?.items ?? []);
  return rows.map((row) =>
    artifactSchema.parse({
      id: String((row as { id?: unknown }).id ?? crypto.randomUUID()),
      softwareId: String((row as { software_id?: unknown }).software_id ?? ''),
      softwareName: (row as { software_name?: unknown }).software_name ?? 'Untitled software',
      version: (row as { version?: unknown }).version ?? '—',
      fileName: (row as { file_name?: unknown }).file_name ?? '—',
      sizeBytes: (row as { size_bytes?: unknown }).size_bytes ?? null,
      sha256: (row as { sha256?: unknown }).sha256 ?? (row as { file_hash?: unknown }).file_hash ?? null,
      scanStatus:
        (row as { verdict?: unknown }).verdict ??
        (row as { scan_status?: unknown }).scan_status ??
        (row as { artifact_status?: unknown }).artifact_status ??
        'unknown',
      createdAt: (row as { created_at?: unknown }).created_at ?? '',
    }),
  );
}

async function fetchArtifacts(limit: number): Promise<Artifact[]> {
  const response = await api.get('/api/v1/software-management/artifacts', { params: { limit } });
  return mapEndpointRows(response.data);
}

export function useArtifacts(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'artifacts', { limit }] as const,
    queryFn: () => fetchArtifacts(limit),
  });
}
