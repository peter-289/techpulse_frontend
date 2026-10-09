import { z } from 'zod';

export const securityScanSchema = z.object({
  id: z.string(),
  softwareId: z.string().default(''),
  softwareName: z.string().default('Untitled software'),
  version: z.string().default('—'),
  file: z.string().default('—'),
  result: z.enum(['clean', 'threat', 'pending', 'unknown']).default('unknown'),
  engine: z.string().optional().default('Scan pipeline'),
  quarantineReason: z.string().nullable().optional().default(null),
  createdAt: z.string().optional().default(''),
});

export type SecurityScan = z.infer<typeof securityScanSchema>;

export function classifyScanStatus(status: unknown): SecurityScan['result'] {
  const value = String(status ?? '').toLowerCase();
  if (!value) return 'unknown';
  if (value.includes('quarantin') || value.includes('block') || value.includes('threat') || value.includes('malware')) {
    return 'threat';
  }
  if (value.includes('pending') || value.includes('scan') || value.includes('review')) return 'pending';
  if (value.includes('active') || value.includes('clean') || value.includes('verified') || value.includes('publish')) {
    return 'clean';
  }
  return 'unknown';
}
