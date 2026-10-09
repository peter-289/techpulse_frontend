import { describe, expect, it } from 'vitest';
import { classifyScanStatus, securityScanSchema } from './security.schema';

describe('classifyScanStatus', () => {
  it('returns unknown for empty input', () => {
    expect(classifyScanStatus(undefined)).toBe('unknown');
    expect(classifyScanStatus('')).toBe('unknown');
  });

  it('detects threats', () => {
    expect(classifyScanStatus('Quarantined')).toBe('threat');
    expect(classifyScanStatus('blocked')).toBe('threat');
    expect(classifyScanStatus('malware found')).toBe('threat');
  });

  it('detects pending scans', () => {
    expect(classifyScanStatus('pending')).toBe('pending');
    expect(classifyScanStatus('in review')).toBe('pending');
    expect(classifyScanStatus('scanning')).toBe('pending');
  });

  it('detects clean artefacts', () => {
    expect(classifyScanStatus('active')).toBe('clean');
    expect(classifyScanStatus('verified')).toBe('clean');
    expect(classifyScanStatus('published')).toBe('clean');
  });

  it('falls back to unknown', () => {
    expect(classifyScanStatus('something-else')).toBe('unknown');
  });
});

describe('securityScanSchema', () => {
  it('applies defaults', () => {
    const scan = securityScanSchema.parse({ id: 's1' });
    expect(scan).toMatchObject({ result: 'unknown', engine: 'Scan pipeline', quarantineReason: null });
  });
});
