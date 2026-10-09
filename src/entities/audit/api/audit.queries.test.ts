import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../mocks/server';
import { createWrapper, renderHook } from '../../../test/render';
import { useAuditEvents } from './audit.queries';

describe('useAuditEvents', () => {
  it('returns an empty list when there are no events', async () => {
    const { result } = renderHook(() => useAuditEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('maps raw audit rows into typed events', async () => {
    server.use(
      http.get('/api/v1/admin/audit-events', () =>
        HttpResponse.json({
          items: [
            {
              id: 'e1',
              method: 'POST',
              path: '/api/v1/software-management/upload',
              event_type: 'Package uploaded',
              actor_username: 'ada',
              success: true,
              occurred_at: '2026-01-01T00:00:00Z',
            },
            {
              id: 'e2',
              method: 'POST',
              path: '/api/v1/auth/login',
              success: false,
              occurred_at: '2026-01-02T00:00:00Z',
            },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useAuditEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({ category: 'Uploads', actor: 'ada', title: 'Package uploaded — ada' });
    expect(result.current.data?.[1]).toMatchObject({ category: 'Access', actor: 'System', success: false });
  });
});
