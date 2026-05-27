import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { supportMessageSchema, type SupportMessage } from '../model/support-message.schema';

async function fetchSupportMessages(limit: number): Promise<SupportMessage[]> {
  const response = await httpClient.get('/api/v1/support-chat/messages', { params: { limit } });
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map((row) => supportMessageSchema.parse(row));
}

export function useSupportMessages(limit = 100) {
  return useQuery({
    queryKey: queryKeys.support.messages(limit),
    queryFn: () => fetchSupportMessages(limit),
  });
}
