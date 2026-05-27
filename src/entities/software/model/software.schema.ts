import { z } from 'zod';

export const softwareSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  name: z.string().default('Untitled package'),
  description: z.string().optional().default(''),
  owner_id: z.union([z.string(), z.number()]).optional().transform((v) => (v == null ? '' : String(v))),
  is_public: z.boolean().optional().default(false),
  category: z.string().optional().default('others'),
  price_cents: z.number().optional().default(0),
  currency: z.string().optional().default('USD'),
  created_at: z.string().optional().default(''),
});

export type Software = z.infer<typeof softwareSchema>;
