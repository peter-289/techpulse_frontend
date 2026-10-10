import { z } from 'zod';

export const supportMessageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  user_id: z.string(),
  role: z.string(),
  user_message: z.string(),
  assistant_message: z.string(),
  created_at: z.string(),
});

export type SupportMessage = z.infer<typeof supportMessageSchema>;

export const supportChatResponseSchema = z.object({
  message_id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  assistant_reply: z.string(),
});

export type SupportChatResponse = z.infer<typeof supportChatResponseSchema>;
