import { z } from 'zod';

export const uploadArtifactSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  category: z.string().min(1),
  isPublic: z.boolean(),
  price: z.coerce.number().min(0, 'Project price cannot be negative.'),
  currency: z.string().min(3),
  version: z.string().min(1, 'Version number is required.'),
  changelog: z.string().optional().default(''),
  file: z.instanceof(File, { message: 'Project package file is required.' }),
});

export type UploadArtifactInput = z.infer<typeof uploadArtifactSchema>;
