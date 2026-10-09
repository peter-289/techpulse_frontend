import { z } from 'zod';

export const auditEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  actor: z.string().default('System'),
  details: z.string().optional().default(''),
  category: z.enum(['Uploads', 'Lifecycle', 'Access', 'Other']).default('Other'),
  success: z.boolean().optional().default(true),
  occurredAt: z.string().optional().default(''),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

export function inferAuditCategory(path: string, eventType: string): AuditEvent['category'] {
  const haystack = `${path} ${eventType}`.toLowerCase();
  if (haystack.includes('upload')) return 'Uploads';
  if (
    haystack.includes('deprecat') ||
    haystack.includes('revoke') ||
    haystack.includes('publish') ||
    haystack.includes('version') ||
    haystack.includes('package')
  ) {
    return 'Lifecycle';
  }
  if (
    haystack.includes('login') ||
    haystack.includes('auth') ||
    haystack.includes('user') ||
    haystack.includes('invite') ||
    haystack.includes('session')
  ) {
    return 'Access';
  }
  return 'Other';
}
