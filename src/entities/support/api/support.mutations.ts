import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import {
  supportChatResponseSchema,
  type SupportMessage,
} from '../model/support-message.schema';

async function sendSupportMessage(content: string): Promise<SupportMessage> {
  const response = await httpClient.post(
    '/api/v1/support-chat/messages',
    { message: content },
    { timeout: 10000 },
  );
  const parsed = supportChatResponseSchema.parse(response.data);
  return {
    id: parsed.message_id,
    user_id: '',
    role: 'assistant',
    user_message: '',
    assistant_message: parsed.assistant_reply,
    created_at: new Date().toISOString(),
  };
}

export function useSendSupportMessage() {
  return useMutation({
    mutationFn: sendSupportMessage,
  });
}

export function useDeleteSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      await httpClient.delete(`/api/v1/support-chat/messages/${messageId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.support.all }),
  });
}
