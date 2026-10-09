import { z } from 'zod';

export const artifactSchema = z.object({
  id: z.string(),
  softwareId: z.string(),
  softwareName: z.string().default('Untitled software'),
  version: z.string().default('—'),
  fileName: z.string().default('—'),
  sizeBytes: z.number().nullable().optional().default(null),
  sha256: z.string().nullable().optional().default(null),
  scanStatus: z.string().optional().default('unknown'),
  createdAt: z.string().optional().default(''),
});

export type Artifact = z.infer<typeof artifactSchema>;
