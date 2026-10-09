import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createWrapper, renderHook } from '../../../test/render';
import { useSecurityScans } from './security.queries';

describe('useSecurityScans', () => {
  it('derives scans from version artifact states when the endpoint is empty', async () => {
    const { result } = renderHook(() => useSecurityScans(2), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.data?.some((scan) => scan.result === 'threat')).toBe(true);
  });
});
