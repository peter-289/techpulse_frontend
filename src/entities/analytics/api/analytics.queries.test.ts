import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../mocks/server';
import { createWrapper, renderHook } from '../../../test/render';
import { useAnalytics } from './analytics.queries';

describe('useAnalytics', () => {
  it('uses the endpoint payload when it is valid', async () => {
    const { result } = renderHook(() => useAnalytics(10, 3), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalDownloads).toBe(0);
    expect(result.current.data?.series).toHaveLength(0);
  });

  it('derives analytics from the catalogue when the endpoint payload is invalid', async () => {
    server.use(
      http.get('/api/v1/analytics', () => HttpResponse.json({ totalDownloads: 'not-a-number' })),
    );
    const { result } = renderHook(() => useAnalytics(3, 5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalSoftware).toBe(3);
    expect(result.current.data?.series).toHaveLength(5);
    expect(result.current.data?.topSoftware.length).toBeGreaterThan(0);
  });
});
