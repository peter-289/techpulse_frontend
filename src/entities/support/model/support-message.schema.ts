import { z } from 'zod';

export const supportMessageSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  content: z.string().optional().default(''),
  role: z.string().optional().default('user'),
  created_at: z.string().optional().default(''),
});

export type SupportMessage = z.infer<typeof supportMessageSchema>;
