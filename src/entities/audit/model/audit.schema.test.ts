import { describe, expect, it } from 'vitest';
import { auditEventSchema, inferAuditCategory } from './audit.schema';

describe('inferAuditCategory', () => {
  it('classifies upload events', () => {
    expect(inferAuditCategory('/api/v1/software/upload', 'upload')).toBe('Uploads');
  });

  it('classifies lifecycle events', () => {
    expect(inferAuditCategory('/versions/1.0.0/deprecate', '')).toBe('Lifecycle');
    expect(inferAuditCategory('/packages/1', 'publish')).toBe('Lifecycle');
  });

  it('classifies access events', () => {
    expect(inferAuditCategory('/api/v1/auth/login', '')).toBe('Access');
    expect(inferAuditCategory('/api/v1/users/5', 'user updated')).toBe('Access');
  });

  it('falls back to Other', () => {
    expect(inferAuditCategory('/metrics', 'heartbeat')).toBe('Other');
  });
});

describe('auditEventSchema', () => {
  it('applies defaults', () => {
    const event = auditEventSchema.parse({ id: '1', title: 'Something' });
    expect(event).toMatchObject({ actor: 'System', category: 'Other', success: true, details: '' });
  });
});
