import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { supportMessageSchema, type SupportMessage } from '../model/support-message.schema';

async function sendSupportMessage(content: string): Promise<SupportMessage> {
  const response = await httpClient.post('/api/v1/support-chat/messages', { content });
  return supportMessageSchema.parse(response.data);
}

export function useSendSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendSupportMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.support.all }),
  });
}
