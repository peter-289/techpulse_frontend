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
  viewer_has_access: z.boolean().optional().default(false),
  latest_version: z.string().nullable().optional().default(null),
  download_count: z.number().optional().default(0),
  created_at: z.string().optional().default(''),
  updated_at: z.string().optional().default(''),
});

export type Software = z.infer<typeof softwareSchema>;

export const softwareVersionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  software_id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  version: z.string(),
  is_published: z.boolean().optional().default(false),
  status: z.string().optional().default('draft'),
  download_count: z.number().optional().default(0),
  release_notes: z.string().optional().default(''),
  created_at: z.string().optional().default(''),
  published_at: z.string().nullable().optional().default(null),
  file_hash: z.string().nullable().optional().default(null),
  size_bytes: z.number().nullable().optional().default(null),
  content_type: z.string().nullable().optional().default(null),
  file_name: z.string().nullable().optional().default(null),
  artifact_status: z.string().nullable().optional().default(null),
  quarantine_reason: z.string().nullable().optional().default(null),
});

export type SoftwareVersion = z.infer<typeof softwareVersionSchema>;

export const softwareSummarySchema = z.object({
  total_packages: z.number().optional().default(0),
  total_versions: z.number().optional().default(0),
  published_versions: z.number().optional().default(0),
  total_downloads: z.number().optional().default(0),
});

export type SoftwareSummary = z.infer<typeof softwareSummarySchema>;
