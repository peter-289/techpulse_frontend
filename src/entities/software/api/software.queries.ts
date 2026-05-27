import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { softwareSchema, type Software } from '../model/software.schema';

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
